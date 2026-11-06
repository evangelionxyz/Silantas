pub mod auth;

use axum::{routing::get, Json, Router};
use serde_json::{json, Value};

use crate::appstate::AppState;

pub fn build_router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root_handler))
        .nest("/auth", auth::auth_routes())
        .with_state(state)
}

pub async fn root_handler() -> Json<Value> {
    Json(json!({ "message": "Silantas Rust Axum API is running!" }))
}