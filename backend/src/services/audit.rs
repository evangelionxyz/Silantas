use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

async fn resolve_audit_username(pool: &PgPool, user_id: Option<Uuid>, username: &str) -> String {
    let trimmed = username.trim();
    let parsed_uuid = Uuid::parse_str(trimmed).ok();

    if !trimmed.is_empty() && parsed_uuid.is_none() {
        return username.to_string();
    }

    let lookup_id = user_id.or(parsed_uuid);
    if let Some(uid) = lookup_id {
        if let Ok(Some(resolved)) = sqlx::query_scalar::<_, String>(
            "SELECT username FROM silantas.users WHERE id = $1;",
        )
        .bind(uid)
        .fetch_optional(pool)
        .await
        {
            if !resolved.trim().is_empty() {
                return resolved;
            }
        }
    }

    username.to_string()
}

pub async fn record_audit_log(
    pool: &PgPool,
    user_id: Option<Uuid>,
    username: &str,
    user_role: &str,
    action: &str,
    entity_type: &str,
    entity_id: Option<&str>,
    description: &str,
    metadata: Option<Value>,
) {
    let log_id = Uuid::new_v4();
    let now = chrono::Utc::now();
    let resolved_username = resolve_audit_username(pool, user_id, username).await;

    let query_res = sqlx::query(
        "INSERT INTO silantas.audit_logs 
        (id, user_id, username, user_role, action, entity_type, entity_id, description, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);"
    )
    .bind(log_id)
    .bind(user_id)
    .bind(&resolved_username)
    .bind(user_role)
    .bind(action)
    .bind(entity_type)
    .bind(entity_id)
    .bind(description)
    .bind(metadata)
    .bind(now)
    .execute(pool)
    .await;

    if let Err(e) = query_res {
        tracing::error!("Failed to record audit log: {e}");
    }
}
