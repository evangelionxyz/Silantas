use axum::{
    extract::State,
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
    models::settings::{UpdateWhatsappRequest, WhatsappConfigResponse},
    services::{audit::record_audit_log, auth::extract_claims_from_headers},
};

pub fn settings_routes() -> Router<AppState> {
    Router::new()
        .route("/whatsapp", get(get_whatsapp_config_handler).put(update_whatsapp_config_handler))
}

pub async fn get_whatsapp_config_handler(
    State(state): State<AppState>,
) -> impl IntoResponse {
    let rows = db::query_as::<sqlx::Postgres, (String, String)>(
        "SELECT key, value FROM silantas.settings WHERE key IN ('whatsapp_number', 'whatsapp_message', 'agency_name');"
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();

    let mut number = "6281240000000".to_string();
    let mut message = "Halo Admin SI-LANTAS HEWAN MIMIKA, saya ingin konsultasi mengenai persyaratan lalu lintas hewan/produk hewan.".to_string();
    let mut agency = "Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika".to_string();

    for (k, v) in rows {
        match k.as_str() {
            "whatsapp_number" => number = v,
            "whatsapp_message" => message = v,
            "agency_name" => agency = v,
            _ => {}
        }
    }

    (
        StatusCode::OK,
        Json(json!(WhatsappConfigResponse {
            whatsapp_number: number,
            whatsapp_message: message,
            agency_name: agency,
        })),
    )
}

pub async fn update_whatsapp_config_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<UpdateWhatsappRequest>,
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
            Json(json!({ "message": "Hanya Administrator yang dapat mengubah pengaturan sistem", "code": "FORBIDDEN" })),
        );
    }

    let clean_number = payload.whatsapp_number.trim().replace([' ', '-', '+'], "");
    let message = payload.whatsapp_message.unwrap_or_else(|| {
        "Halo Admin SI-LANTAS HEWAN MIMIKA, saya ingin konsultasi mengenai persyaratan lalu lintas hewan/produk hewan.".to_string()
    });

    let now = chrono::Utc::now();

    let _ = db::query(
        "INSERT INTO silantas.settings (key, value, updated_at)
         VALUES ('whatsapp_number', $1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;"
    )
    .bind(&clean_number)
    .bind(now)
    .execute(&state.pool)
    .await;

    let _ = db::query(
        "INSERT INTO silantas.settings (key, value, updated_at)
         VALUES ('whatsapp_message', $1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;"
    )
    .bind(&message)
    .bind(now)
    .execute(&state.pool)
    .await;

    record_audit_log(
        &state.pool,
        Uuid::parse_str(&claims.sub).ok(),
        &claims.sub,
        &claims.role,
        "UPDATE",
        "SETTINGS",
        Some("whatsapp_config"),
        &format!("Memperbarui nomor WhatsApp pelayanan menjadi: {}", clean_number),
        Some(json!({ "whatsappNumber": clean_number })),
    )
    .await;

    (
        StatusCode::OK,
        Json(json!({
            "message": "Konfigurasi WhatsApp berhasil disimpan",
            "whatsappNumber": clean_number,
            "whatsappMessage": message
        })),
    )
}
