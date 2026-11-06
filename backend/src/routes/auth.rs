use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    appstate::AppState,
    db,
    models::user::{AuthResponse, LoginRequest, User, UserWithPassword},
    services::{
        audit::record_audit_log,
        auth::{create_jwt, extract_claims_from_headers, verify_password},
    },
};

pub fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(login_handler))
        .route("/me", get(me_handler))
}

pub async fn login_handler(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let identifier = payload.identifier.trim().to_lowercase();
    let password = payload.password;

    if identifier.is_empty() || password.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "message": "Username/email dan kata sandi wajib diisi",
                "code": "MISSING_REQUIRED_FIELDS"
            })),
        );
    }

    let user_record = db::query_as::<sqlx::Postgres, UserWithPassword>(
        "SELECT id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at
        FROM silantas.users WHERE username = $1 OR email = $1;"
    )
    .bind(&identifier)
    .fetch_optional(&state.pool)
    .await;

    let user = match user_record {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "message": "Username/email atau kata sandi tidak cocok",
                    "code": "INVALID_CREDENTIALS"
                })),
            );
        }
        Err(e) => {
            tracing::error!("Database query error on login: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "message": "Terjadi kesalahan pada database",
                    "code": "DB_ERROR"
                })),
            );
        }
    };

    if !user.is_active {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "message": "Akun Anda berstatus nonaktif. Silakan hubungi Administrator Dinas Peternakan.",
                "code": "ACCOUNT_INACTIVE"
            })),
        );
    }

    if !verify_password(&password, &user.password_hash) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({
                "message": "Username/email atau kata sandi tidak cocok",
                "code": "INVALID_CREDENTIALS"
            })),
        );
    }

    let token = match create_jwt(&user.id.to_string(), &user.role, &state.config.jwt_secret) {
        Ok(t) => t,
        Err(e) => {
            tracing::error!("JWT creation error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "message": "Gagal menghasilkan token autentikasi",
                    "code": "TOKEN_ERROR"
                })),
            );
        }
    };

    record_audit_log(
        &state.pool,
        Some(user.id),
        &user.username,
        &user.role,
        "LOGIN",
        "AUTH",
        Some(&user.id.to_string()),
        &format!("Pengguna {} ({}) berhasil masuk ke sistem", user.full_name, user.username),
        None,
    )
    .await;

    let user_dto = User {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        phone_number: user.phone_number,
        agency: user.agency,
        created_at: user.created_at,
        updated_at: user.updated_at,
    };

    (
        StatusCode::OK,
        Json(json!(AuthResponse {
            token,
            user: user_dto,
        })),
    )
}

pub async fn me_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(err_code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": err_code })),
            );
        }
    };

    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Identitas token tidak valid", "code": "INVALID_TOKEN_SUBJECT" })),
            );
        }
    };

    let user_record = db::query_as::<sqlx::Postgres, UserWithPassword>(
        "SELECT id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at
        FROM silantas.users WHERE id = $1;"
    )
    .bind(user_id)
    .fetch_optional(&state.pool)
    .await;

    match user_record {
        Ok(Some(u)) => {
            if !u.is_active {
                return (
                    StatusCode::FORBIDDEN,
                    Json(json!({ "message": "Akun dinonaktifkan", "code": "ACCOUNT_INACTIVE" })),
                );
            }

            let user_dto = User {
                id: u.id,
                full_name: u.full_name,
                username: u.username,
                email: u.email,
                role: u.role,
                is_active: u.is_active,
                phone_number: u.phone_number,
                agency: u.agency,
                created_at: u.created_at,
                updated_at: u.updated_at,
            };
            (StatusCode::OK, Json(json!(user_dto)))
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Pengguna tidak ditemukan", "code": "USER_NOT_FOUND" })),
        ),
        Err(e) => {
            tracing::error!("Database query error on me: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan pada database", "code": "DB_ERROR" })),
            )
        }
    }
}
