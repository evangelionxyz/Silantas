use std::env;
use std::fs;
use std::io::Cursor;
use std::path::Path;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub jwt_secret: String,
    pub mini_redis_enabled: bool,
}

fn clean_val(v: String) -> String {
    let trimmed = v.trim().trim_matches('"').trim_matches('\'').trim();
    let without_comment = if let Some(idx) = trimmed.find('#') {
        trimmed[..idx].trim()
    } else {
        trimmed
    };
    without_comment.to_string()
}

pub(crate) fn get_clean_env(key: &str) -> Option<String> {
    env::var(key).ok().map(clean_val).filter(|s| !s.is_empty())
}

fn load_env_file(path: &Path) -> Result<(), String> {
    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let mut normalized = String::with_capacity(content.len());

    for line in content.lines() {
        normalized.push_str(line);
        normalized.push('\n');
    }

    dotenvy::from_read(Cursor::new(normalized)).map_err(|error| error.to_string())
}

impl Config {
    pub fn load() -> Self {
        for candidate in &[".env", "../.env"] {
            let path = Path::new(candidate);
            if path.exists() {
                if let Err(error) = load_env_file(path) {
                    tracing::warn!("Failed to load env file {}: {error}", path.display());
                }
                break;
            }
        }

        let database_url = Self::resolve_database_url();
        let port = get_clean_env("PORT")
            .and_then(|p| p.parse().ok())
            .unwrap_or(8000);
        let jwt_secret = get_clean_env("JWT_SECRET").unwrap_or_else(|| {
            "default-secret-key-silantas-mimika-replace-in-production".to_string()
        });
        let mini_redis_enabled = get_clean_env("MINI_REDIS_ENABLED")
            .map(|v| !matches!(v.to_lowercase().as_str(), "false" | "0" | "no"))
            .unwrap_or(true);

        Self {
            port,
            database_url,
            jwt_secret,
            mini_redis_enabled,
        }
    }

    fn resolve_database_url() -> String {
        if let Some(url) = get_clean_env("POSTGRESQL_DATABASE_URL").or_else(|| get_clean_env("DATABASE_URL")) {
            if url.starts_with("postgres://") || url.starts_with("postgresql://") {
                return url;
            }
        }

        let user = get_clean_env("POSTGRESQL_USERNAME").unwrap_or_else(|| "postgres".to_string());
        let pwd = get_clean_env("POSTGRESQL_PASSWORD").unwrap_or_default();
        let host = get_clean_env("POSTGRESQL_HOST").unwrap_or_else(|| "localhost".to_string());
        let port = get_clean_env("POSTGRESQL_PORT").unwrap_or_else(|| "5432".to_string());
        let db = get_clean_env("POSTGRESQL_DATABASE").unwrap_or_else(|| "postgres".to_string());

        format!("postgres://{user}:{pwd}@{host}:{port}/{db}")
    }
}
