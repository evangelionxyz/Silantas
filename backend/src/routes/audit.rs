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
    models::audit::{AuditFilterParams, AuditLogRecord},
    services::auth::extract_claims_from_headers,
};

pub fn audit_routes() -> Router<AppState> {
    Router::new().route("/", get(list_audit_logs_handler))
}

fn push_audit_filters<'a>(
    qb: &mut sqlx::QueryBuilder<'a, sqlx::Postgres>,
    params: &'a AuditFilterParams,
) {
    if let Some(search) = params.search.as_deref() {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            let pattern = format!("%{trimmed}%");
            qb.push(" AND (a.description ILIKE ");
            qb.push_bind(pattern.clone());
            qb.push(" OR a.username ILIKE ");
            qb.push_bind(pattern.clone());
            qb.push(" OR u.username ILIKE ");
            qb.push_bind(pattern.clone());
            qb.push(" OR u.full_name ILIKE ");
            qb.push_bind(pattern.clone());
            qb.push(" OR u_by_text.username ILIKE ");
            qb.push_bind(pattern.clone());
            qb.push(" OR a.entity_id ILIKE ");
            qb.push_bind(pattern);
            qb.push(")");
        }
    }

    if let Some(act) = params.action.as_deref() {
        let trimmed = act.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            qb.push(" AND a.action = ");
            qb.push_bind(trimmed.to_string());
        }
    }

    if let Some(ent) = params.entity_type.as_deref() {
        let trimmed = ent.trim();
        if !trimmed.is_empty() && trimmed != "ALL" {
            qb.push(" AND a.entity_type = ");
            qb.push_bind(trimmed.to_string());
        }
    }
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
        "SELECT
            a.id,
            a.user_id,
            CASE
                WHEN a.username = '' OR a.username ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                    THEN COALESCE(NULLIF(u.username, ''), NULLIF(u_by_text.username, ''), a.username)
                ELSE a.username
            END AS username,
            a.user_role,
            a.action,
            a.entity_type,
            a.entity_id,
            a.description,
            a.metadata,
            a.created_at
         FROM silantas.audit_logs a
         LEFT JOIN silantas.users u ON u.id = a.user_id
         LEFT JOIN silantas.users u_by_text ON a.user_id IS NULL AND u_by_text.id::text = a.username
         WHERE 1=1"
    );

    push_audit_filters(&mut query_builder, &params);

    query_builder.push(" ORDER BY a.created_at DESC LIMIT ");
    query_builder.push_bind(per_page);
    query_builder.push(" OFFSET ");
    query_builder.push_bind(offset);

    let logs = query_builder
        .build_query_as::<AuditLogRecord>()
        .fetch_all(&state.pool)
        .await;

    match logs {
        Ok(items) => {
            let mut count_builder = sqlx::QueryBuilder::new(
                "SELECT COUNT(*)
                 FROM silantas.audit_logs a
                 LEFT JOIN silantas.users u ON u.id = a.user_id
                 LEFT JOIN silantas.users u_by_text ON a.user_id IS NULL AND u_by_text.id::text = a.username
                 WHERE 1=1"
            );
            push_audit_filters(&mut count_builder, &params);

            let total = count_builder
                .build_query_scalar::<i64>()
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
