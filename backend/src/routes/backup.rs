use std::fs;

use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Json, Router,
};
use serde_json::json;
use uuid::Uuid;

use crate::{
    appstate::AppState,
    models::backup::UpdateBackupConfigRequest,
    services::{
        audit::record_audit_log,
        auth::extract_claims_from_headers,
        backup::{
            create_database_backup, get_backup_dir, get_database_status,
            list_backup_files, sanitize_backup_filename, update_backup_config,
        },
    },
};

pub fn backup_routes() -> Router<AppState> {
    Router::new()
        .route("/status", get(get_backup_status_handler))
        .route("/list", get(list_backups_handler))
        .route("/create", post(create_manual_backup_handler))
        .route("/config", put(update_backup_config_handler))
        .route("/download/{filename}", get(download_backup_file_handler))
        .route("/{filename}", delete(delete_backup_file_handler))
}

pub async fn get_backup_status_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            )
                .into_response();
        }
    };

    if claims.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator yang berwenang mengakses status cadangan",
                "code": "FORBIDDEN"
            })),
        )
            .into_response();
    }

    match get_database_status(&state.pool).await {
        Ok(status) => (StatusCode::OK, Json(json!(status))).into_response(),
        Err(e) => {
            tracing::error!("Failed to fetch database status: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": format!("Gagal memuat status basis data: {e}") })),
            )
                .into_response()
        }
    }
}

pub async fn list_backups_handler(
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
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator yang berwenang",
                "code": "FORBIDDEN"
            })),
        );
    }

    let files = list_backup_files();
    (StatusCode::OK, Json(json!(files)))
}

pub async fn create_manual_backup_handler(
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
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator yang berwenang membuat cadangan",
                "code": "FORBIDDEN"
            })),
        );
    }

    match create_database_backup(&state.pool, &state.config, "MANUAL").await {
        Ok(file) => {
            record_audit_log(
                &state.pool,
                Uuid::parse_str(&claims.sub).ok(),
                &claims.sub,
                &claims.role,
                "BACKUP_MANUAL",
                "DATABASE",
                Some(&file.filename),
                &format!("Membuat cadangan manual basis data: {}", file.filename),
                Some(json!({
                    "filename": file.filename,
                    "size": file.size_display,
                    "checksum": file.checksum_sha256
                })),
            )
            .await;

            (
                StatusCode::OK,
                Json(json!({
                    "message": "Cadangan basis data berhasil dibuat",
                    "file": file
                })),
            )
        }
        Err(e) => {
            tracing::error!("Manual backup creation failed: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": format!("Gagal membuat cadangan basis data: {e}") })),
            )
        }
    }
}

pub async fn update_backup_config_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateBackupConfigRequest>,
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
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator yang berwenang mengubah konfigurasi cadangan",
                "code": "FORBIDDEN"
            })),
        );
    }

    match update_backup_config(&state.pool, &payload).await {
        Ok(new_config) => {
            record_audit_log(
                &state.pool,
                Uuid::parse_str(&claims.sub).ok(),
                &claims.sub,
                &claims.role,
                "UPDATE",
                "SETTINGS",
                Some("backup_config"),
                &format!(
                    "Memperbarui konfigurasi cadangan: interval {} hari, retensi {}, aktif {}",
                    new_config.interval_days, new_config.retention_count, new_config.auto_enabled
                ),
                Some(json!(new_config)),
            )
            .await;

            (
                StatusCode::OK,
                Json(json!({
                    "message": "Konfigurasi cadangan basis data berhasil diperbarui",
                    "config": new_config
                })),
            )
        }
        Err(e) => {
            tracing::error!("Failed to update backup config: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": format!("Gagal menyimpan pengaturan cadangan: {e}") })),
            )
        }
    }
}

pub async fn download_backup_file_handler(
    State(state): State<AppState>,
    Path(filename): Path<String>,
    headers: HeaderMap,
) -> Response {
    let claims = match extract_claims_from_headers(&headers, &state.config.jwt_secret) {
        Ok(c) => c,
        Err(code) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "message": "Otorisasi tidak valid", "code": code })),
            )
                .into_response();
        }
    };

    if claims.role != "admin" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator yang berwenang mengunduh cadangan",
                "code": "FORBIDDEN"
            })),
        )
            .into_response();
    }

    let safe_filename = match sanitize_backup_filename(&filename) {
        Ok(f) => f,
        Err(err_msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "message": err_msg })),
            )
                .into_response();
        }
    };

    let dir = get_backup_dir();
    let file_path = dir.join(&safe_filename);

    if !file_path.exists() || !file_path.is_file() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Berkas cadangan tidak ditemukan" })),
        )
            .into_response();
    }

    let content = match tokio::fs::read(&file_path).await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": format!("Gagal membaca berkas cadangan: {e}") })),
            )
                .into_response();
        }
    };

    let file_size = content.len();
    let body = Body::from(content);

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/sql; charset=utf-8")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", safe_filename),
        )
        .header(header::CONTENT_LENGTH, file_size.to_string())
        .body(body)
        .unwrap_or_else(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                "Error generating download response",
            )
                .into_response()
        })
}

pub async fn delete_backup_file_handler(
    State(state): State<AppState>,
    Path(filename): Path<String>,
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
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator yang berwenang menghapus cadangan",
                "code": "FORBIDDEN"
            })),
        );
    }

    let safe_filename = match sanitize_backup_filename(&filename) {
        Ok(f) => f,
        Err(err_msg) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "message": err_msg })),
            );
        }
    };

    let dir = get_backup_dir();
    let file_path = dir.join(&safe_filename);

    if !file_path.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({ "message": "Berkas cadangan tidak ditemukan" })),
        );
    }

    match fs::remove_file(&file_path) {
        Ok(_) => {
            record_audit_log(
                &state.pool,
                Uuid::parse_str(&claims.sub).ok(),
                &claims.sub,
                &claims.role,
                "DELETE",
                "DATABASE_BACKUP",
                Some(&safe_filename),
                &format!("Menghapus berkas cadangan basis data: {}", safe_filename),
                None,
            )
            .await;

            (
                StatusCode::OK,
                Json(json!({
                    "message": "Berkas cadangan berhasil dihapus",
                    "filename": safe_filename
                })),
            )
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "message": format!("Gagal menghapus berkas: {e}") })),
        ),
    }
}
