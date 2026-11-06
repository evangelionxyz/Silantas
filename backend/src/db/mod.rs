use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use sqlx::PgPool;
use std::str::FromStr;
use std::time::Duration;

pub fn get_connect_options(database_url: &str) -> Result<PgConnectOptions, sqlx::Error> {
    let options = PgConnectOptions::from_str(database_url)?
        .statement_cache_capacity(0); // Essential for PgBouncer pooler
    Ok(options)
}

/// Help to construct queries with `.persistent(false)` for PgBouncer  Compatibility.
/// Prevents named prepared statement collisions (`sqlx_s... alread exists`) in transaction pooling mode.
pub fn query<'q>(sql: &'q str) -> sqlx::query::Query<'q, sqlx::Postgres, <sqlx::Postgres as sqlx::Database>::Arguments<'q>> {
    sqlx::query(sql).persistent(false)
}

/// Helper to consturct query_as with `.persistent(false)` for PgBouncer compatibility.
pub fn query_as<'q, DB, O>(sql: &'q str) 
-> sqlx::query::QueryAs<'q, DB, O, <DB as sqlx::Database>::Arguments<'q>>
where
    DB: sqlx::Database + sqlx::database::HasStatementCache,
    O: for<'r> sqlx::FromRow<'r, DB::Row>,
{
    sqlx::query_as(sql).persistent(false)
}

/// Helper to consturct query_scalar with `.persistent(false)` for PgBouncer compatibility.
pub fn query_scalar<'q, DB, O>(sql: &'q str) 
-> sqlx::query::QueryScalar<'q, DB, O, <DB as sqlx::Database>::Arguments<'q>>
where 
    DB: sqlx::Database + sqlx::database::HasStatementCache,
    (O,): for<'r> sqlx::FromRow<'r, DB::Row>,
{
    sqlx::query_scalar(sql).persistent(false)
}

pub fn get_pool_options() -> PgPoolOptions {
    PgPoolOptions::new()
        .max_connections(3)
        .min_connections(0)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(10))
        .max_lifetime(Duration::from_secs(5 * 60))
}

pub async fn create_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let options = get_connect_options(database_url)?;

    let pool = get_pool_options()
        .connect_with(options)
        .await?;

    init_database(&pool).await?;
    Ok(pool)
}

pub async fn init_database(
    pool: &PgPool
)-> Result<(), sqlx::Error> {
    let init_sql = r#"
        -- Create Schema
        CREATE SCHEMA IF NOT EXISTS silantas;

        -- Create Users
        CREATE TABLE IF NOT EXISTS silantas.users (
            id UUID PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            username VARCHAR(64) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(64) NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON silantas.users(email);
    "#;

    sqlx::raw_sql(init_sql)
        .execute(pool)
        .await?;

    tracing::info!("Database schema and tables initialized successfully.");
    Ok(())
}
