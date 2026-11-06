use axum::{
    extract::{Path, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    appstate::AppState,
    db,
    models::user::{CreateUserRequest, UpdateUserRequest, User, UserWithPassword},
    services::{
        audit::record_audit_log,
        auth::{extract_claims_from_headers, hash_password},
    },
};

pub fn user_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_users_handler).post(create_user_handler))
        .route("/{id}", get(get_user_handler).put(update_user_handler).delete(delete_user_handler))
}

pub async fn list_users_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Akses ditolak: Hanya Administrator yang berwenang", "code": "FORBIDDEN" })),
        );
    }

    let records = db::query_as::<sqlx::Postgres, User>(
        "SELECT id, full_name, username, email, role, is_active, phone_number, agency, created_at, updated_at
        FROM silantas.users ORDER BY created_at DESC;"
    )
    .fetch_all(&state.pool)
    .await;

    match records {
        Ok(users) => (StatusCode::OK, Json(json!(users))),
        Err(e) => {
            tracing::error!("Failed to fetch users: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal mengambil daftar pengguna", "code": "DB_ERROR" })),
            )
        }
    }
}

pub async fn get_user_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" && claims.sub != id.to_string() {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Akses ditolak", "code": "FORBIDDEN" })),
        );
    }

    let record = db::query_as::<sqlx::Postgres, User>(
        "SELECT id, full_name, username, email, role, is_active, phone_number, agency, created_at, updated_at
        FROM silantas.users WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    match record {
        Ok(Some(u)) => (StatusCode::OK, Json(json!(u))),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Pengguna tidak ditemukan", "code": "NOT_FOUND" })),
        ),
        Err(e) => {
            tracing::error!("Error fetching user: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan pada database", "code": "DB_ERROR" })),
            )
        }
    }
}

pub async fn create_user_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<CreateUserRequest>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Akses ditolak: Hanya Administrator yang berwenang", "code": "FORBIDDEN" })),
        );
    }

    let username = payload.username.trim().to_lowercase();
    let email = payload.email.trim().to_lowercase();
    let full_name = payload.full_name.trim().to_string();

    if username.is_empty() || email.is_empty() || payload.password.is_empty() || full_name.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "message": "Nama lengkap, username, email, dan kata sandi wajib diisi", "code": "MISSING_FIELDS" })),
        );
    }

    let role = match payload.role.as_str() {
        "admin" | "petugas" | "dokter_hewan" | "pimpinan" => payload.role,
        _ => "petugas".to_string(),
    };

    let existing = db::query_as::<sqlx::Postgres, UserWithPassword>(
        "SELECT id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at
        FROM silantas.users WHERE username = $1 OR email = $2;"
    )
    .bind(&username)
    .bind(&email)
    .fetch_optional(&state.pool)
    .await;

    if let Ok(Some(existing_user)) = existing {
        let msg = if existing_user.username == username {
            "Username telah digunakan"
        } else {
            "Email telah digunakan"
        };
        return (
            StatusCode::CONFLICT,
            Json(json!({ "message": msg, "code": "USER_EXISTS" })),
        );
    }

    let password_hash = match hash_password(&payload.password) {
        Ok(h) => h,
        Err(e) => {
            tracing::error!("Hash error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal mengenkripsi kata sandi", "code": "HASH_ERROR" })),
            );
        }
    };

    let new_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let agency = payload.agency.unwrap_or_else(|| "Dinas Peternakan dan Kesehatan Hewan Kab. Mimika".to_string());

    let insert_res = db::query(
        "INSERT INTO silantas.users 
        (id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10);"
    )
    .bind(new_id)
    .bind(&full_name)
    .bind(&username)
    .bind(&email)
    .bind(&password_hash)
    .bind(&role)
    .bind(&payload.phone_number)
    .bind(&agency)
    .bind(now)
    .bind(now)
    .execute(&state.pool)
    .await;

    if let Err(e) = insert_res {
        tracing::error!("Insert user error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal menyimpan pengguna baru", "code": "DB_INSERT_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        Uuid::parse_str(&claims.sub).ok(),
        &claims.sub,
        &claims.role,
        "CREATE",
        "USER",
        Some(&new_id.to_string()),
        &format!("Membuat akun pengguna baru: {} ({}) dengan role {}", full_name, username, role),
        Some(json!({ "username": username, "role": role, "email": email })),
    )
    .await;

    let created_user = User {
        id: new_id,
        full_name,
        username,
        email,
        role,
        is_active: true,
        phone_number: payload.phone_number,
        agency: Some(agency),
        created_at: now,
        updated_at: now,
    };

    (StatusCode::CREATED, Json(json!(created_user)))
}

pub async fn update_user_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Hanya Administrator yang dapat mengubah data akun pengguna", "code": "FORBIDDEN" })),
        );
    }

    let existing = db::query_as::<sqlx::Postgres, UserWithPassword>(
        "SELECT id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at
        FROM silantas.users WHERE id = $1;"
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await;

    let current = match existing {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({ "message": "Pengguna tidak ditemukan", "code": "NOT_FOUND" })),
            );
        }
        Err(e) => {
            tracing::error!("DB error: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Terjadi kesalahan pada database", "code": "DB_ERROR" })),
            );
        }
    };

    let full_name = payload.full_name.unwrap_or(current.full_name);
    let email = payload.email.unwrap_or(current.email);
    let role = payload.role.unwrap_or(current.role);
    let is_active = payload.is_active.unwrap_or(current.is_active);
    let phone_number = payload.phone_number.or(current.phone_number);
    let agency = payload.agency.or(current.agency);

    let password_hash = if let Some(new_pwd) = payload.password.filter(|p| !p.trim().is_empty()) {
        match hash_password(&new_pwd) {
            Ok(h) => h,
            Err(_) => current.password_hash,
        }
    } else {
        current.password_hash
    };

    let now = chrono::Utc::now();

    let update_res = db::query(
        "UPDATE silantas.users 
        SET full_name = $1, email = $2, role = $3, is_active = $4, phone_number = $5, agency = $6, password_hash = $7, updated_at = $8
        WHERE id = $9;"
    )
    .bind(&full_name)
    .bind(&email)
    .bind(&role)
    .bind(is_active)
    .bind(&phone_number)
    .bind(&agency)
    .bind(&password_hash)
    .bind(now)
    .bind(id)
    .execute(&state.pool)
    .await;

    if let Err(e) = update_res {
        tracing::error!("Update user error: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": "Gagal memperbarui pengguna", "code": "DB_UPDATE_ERROR" })),
        );
    }

    record_audit_log(
        &state.pool,
        Uuid::parse_str(&claims.sub).ok(),
        &claims.sub,
        &claims.role,
        "UPDATE",
        "USER",
        Some(&id.to_string()),
        &format!("Memperbarui data pengguna: {} (Role: {}, Aktif: {})", full_name, role, is_active),
        Some(json!({ "userId": id, "role": role, "isActive": is_active })),
    )
    .await;

    let updated_user = User {
        id,
        full_name,
        username: current.username,
        email,
        role,
        is_active,
        phone_number,
        agency,
        created_at: current.created_at,
        updated_at: now,
    };

    (StatusCode::OK, Json(json!(updated_user)))
}

pub async fn delete_user_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            );
        }
    };

    if claims.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({ "message": "Hanya Administrator yang dapat menghapus akun pengguna", "code": "FORBIDDEN" })),
        );
    }

    if claims.sub == id.to_string() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "message": "Tidak dapat menghapus akun Anda sendiri yang sedang aktif", "code": "CANNOT_DELETE_SELF" })),
        );
    }

    let del_res = db::query("DELETE FROM silantas.users WHERE id = $1;")
        .bind(id)
        .execute(&state.pool)
        .await;

    match del_res {
        Ok(res) if res.rows_affected() > 0 => {
            record_audit_log(
                &state.pool,
                Uuid::parse_str(&claims.sub).ok(),
                &claims.sub,
                &claims.role,
                "DELETE",
                "USER",
                Some(&id.to_string()),
                &format!("Menghapus akun pengguna dengan ID: {}", id),
                None,
            )
            .await;

            (StatusCode::OK, Json(json!({ "message": "Pengguna berhasil dihapus" })))
        }
        Ok(_) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Pengguna tidak ditemukan", "code": "NOT_FOUND" })),
        ),
        Err(e) => {
            tracing::error!("Delete user error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal menghapus pengguna karena memiliki relasi data", "code": "DB_DELETE_ERROR" })),
            )
        }
    }
}
