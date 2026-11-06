pub mod audit;
pub mod auth;
pub mod settings;
pub mod traffic;
pub mod users;

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

use crate::appstate::AppState;

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root_handler))
        .nest("/auth", auth::auth_routes())
        .nest("/api/users", users::user_routes())
        .nest("/api/traffic", traffic::traffic_routes())
        .nest("/api/audit-logs", audit::audit_routes())
        .nest("/api/settings", settings::settings_routes())
        .with_state(state)
}

pub async fn root_handler() -> Json<Value> {
    Json(json!({
        "service": "SI-LANTAS HEWAN MIMIKA API",
        "agency": "Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika",
        "status": "online"
    }))
}
