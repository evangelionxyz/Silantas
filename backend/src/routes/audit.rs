use axum::{
    extract::{Query, State},
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde_json::json;

use crate::{
    appstate::AppState,
    db,
    models::audit::{AuditFilterParams, AuditLogRecord},
    services::auth::extract_claims_from_headers,
};

pub fn audit_routes() -> Router<AppState> {
    Router::new().route("/", get(list_audit_logs_handler))
}

pub async fn list_audit_logs_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<AuditFilterParams>,
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

    if claims.role != "admin" && claims.role != "pimpinan" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({
                "message": "Akses ditolak: Hanya Administrator dan Pimpinan yang berwenang meninjau log audit",
                "code": "FORBIDDEN"
            })),
        );
    }

    let page = params.page.unwrap_or(1).max(1);
    let per_page = params.per_page.unwrap_or(30).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut query_builder = sqlx::QueryBuilder::new(
        "SELECT id, user_id, username, user_role, action, entity_type, entity_id, description, metadata, created_at 
         FROM silantas.audit_logs WHERE 1=1"
    );

    if let Some(search) = params.search.as_deref() {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{}%", trimmed);
            query_builder.push(" AND (description ILIKE ");
            query_builder.push_bind(pattern.clone());
            query_builder.push(" OR username ILIKE ");
            query_builder.push_bind(pattern.clone());
            query_builder.push(" OR entity_id ILIKE ");
            query_builder.push_bind(pattern);
            query_builder.push(")");
        }
    }

    if let Some(act) = params.action.as_deref() {
        let trimmed = act.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            query_builder.push(" AND action = ");
            query_builder.push_bind(trimmed.to_string());
        }
    }

    if let Some(ent) = params.entity_type.as_deref() {
        let trimmed = ent.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            query_builder.push(" AND entity_type = ");
            query_builder.push_bind(trimmed.to_string());
        }
    }

    query_builder.push(" ORDER BY created_at DESC LIMIT ");
    query_builder.push_bind(per_page);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let logs = query_builder
        .build_query_as::<AuditLogRecord>()
        .fetch_all(&state.pool)
        .await;

    match logs {
        Ok(items) => {
            let total = db::query_scalar::<sqlx::Postgres, i64>(
                "SELECT COUNT(*) FROM silantas.audit_logs;"
            )
            .fetch_one(&state.pool)
            .await
            .unwrap_or(0);

            (
                StatusCode::OK,
                Json(json!({
                    "data": items,
                    "meta": {
                        "page": page,
                        "perPage": per_page,
                        "total": total,
                        "totalPages": (total as f64 / per_page as f64).ceil() as i64
                    }
                })),
            )
        }
        Err(e) => {
            tracing::error!("Fetch audit logs error: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "message": "Gagal mengambil log audit", "code": "DB_ERROR" })),
            )
        }
    }
}
