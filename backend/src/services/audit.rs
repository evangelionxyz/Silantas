use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

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

    let query_res = sqlx::query(
        "INSERT INTO silantas.audit_logs 
        (id, user_id, username, user_role, action, entity_type, entity_id, description, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);"
    )
    .bind(log_id)
    .bind(user_id)
    .bind(username)
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
