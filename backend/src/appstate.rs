use std::sync::Arc;
use sqlx::PgPool;

use crate::{config::Config, services::MiniRedisService};

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: Config,
    pub redis: Option<Arc<MiniRedisService>>,
}
