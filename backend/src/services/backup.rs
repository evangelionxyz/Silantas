use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use chrono::{DateTime, Utc};
use hex;
use sha2::{Digest, Sha256};
use sqlx::{PgPool, Row};
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

use crate::{
    config::Config,
    models::backup::{
        BackupConfigResponse, BackupFileItem, DatabaseStatusResponse, TableStatItem,
        UpdateBackupConfigRequest,
    },
    services::audit::record_audit_log,
};

const DEFAULT_INTERVAL_DAYS: u32 = 7;
const DEFAULT_RETENTION_COUNT: u32 = 10;
const SETTING_KEY_INTERVAL: &str = "backup_interval_days";
const SETTING_KEY_AUTO_ENABLED: &str = "backup_auto_enabled";
const SETTING_KEY_RETENTION: &str = "backup_retention_count";
const SETTING_KEY_LAST_RUN: &str = "backup_last_run";
const SETTING_KEY_LAST_STATUS: &str = "backup_last_status";

/// Resolve the local backup directory, creating it if it doesn't exist
pub fn get_backup_dir() -> PathBuf {
    let dir_str = std::env::var("BACKUP_DIR").unwrap_or_else(|_| "./backups".to_string());
    let path = PathBuf::from(dir_str);
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path
}

/// Sanitize filename to prevent directory traversal and ensure .zip or .sql extension
pub fn sanitize_backup_filename(raw_name: &str) -> Result<String, &'static str> {
    let trimmed = raw_name.trim();
    if trimmed.is_empty() {
        return Err("Filename cannot be empty");
    }
    if trimmed.contains("..") || trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains(':') {
        return Err("Filename contains forbidden path characters");
    }
    if !(trimmed.ends_with(".zip") || trimmed.ends_with(".sql")) {
        return Err("Backup file must have .zip or .sql extension");
    }
    // Must contain only safe characters: alphanumeric, underscore, hyphen, dot
    if !trimmed.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-' || c == '.') {
        return Err("Filename contains invalid characters");
    }
    Ok(trimmed.to_string())
}

/// Format bytes into human readable format (KB, MB, GB)
pub fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = 1024 * KB;
    const GB: u64 = 1024 * MB;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

/// Calculate SHA-256 checksum of a file
pub fn calculate_file_sha256(path: &Path) -> Result<String, std::io::Error> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let n = file.read(&mut buffer)?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }

    Ok(hex::encode(hasher.finalize()))
}

/// Retrieve backup configuration from silantas.settings
pub async fn get_backup_config(pool: &PgPool) -> BackupConfigResponse {
    let rows = sqlx::query_as::<sqlx::Postgres, (String, String)>(
        "SELECT key, value FROM silantas.settings WHERE key IN ($1, $2, $3, $4, $5);",
    )
    .bind(SETTING_KEY_INTERVAL)
    .bind(SETTING_KEY_AUTO_ENABLED)
    .bind(SETTING_KEY_RETENTION)
    .bind(SETTING_KEY_LAST_RUN)
    .bind(SETTING_KEY_LAST_STATUS)
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut interval_days = DEFAULT_INTERVAL_DAYS;
    let mut auto_enabled = true;
    let mut retention_count = DEFAULT_RETENTION_COUNT;
    let mut last_run = None;
    let mut last_status = None;

    for (k, v) in rows {
        match k.as_str() {
            SETTING_KEY_INTERVAL => {
                if let Ok(val) = v.parse::<u32>() {
                    interval_days = val.clamp(1, 365);
                }
            }
            SETTING_KEY_AUTO_ENABLED => {
                auto_enabled = !matches!(v.to_lowercase().as_str(), "false" | "0" | "no");
            }
            SETTING_KEY_RETENTION => {
                if let Ok(val) = v.parse::<u32>() {
                    retention_count = val.clamp(1, 100);
                }
            }
            SETTING_KEY_LAST_RUN => {
                if !v.trim().is_empty() {
                    last_run = Some(v);
                }
            }
            SETTING_KEY_LAST_STATUS => {
                if !v.trim().is_empty() {
                    last_status = Some(v);
                }
            }
            _ => {}
        }
    }

    let next_run = if auto_enabled {
        if let Some(ref lr) = last_run {
            if let Ok(parsed_time) = DateTime::parse_from_rfc3339(lr) {
                let next = parsed_time + chrono::Duration::days(interval_days as i64);
                Some(next.to_rfc3339())
            } else {
                Some(Utc::now().to_rfc3339())
            }
        } else {
            Some(Utc::now().to_rfc3339())
        }
    } else {
        None
    };

    BackupConfigResponse {
        interval_days,
        auto_enabled,
        retention_count,
        last_run,
        last_status,
        next_run,
    }
}

/// Update backup configuration in silantas.settings
pub async fn update_backup_config(
    pool: &PgPool,
    req: &UpdateBackupConfigRequest,
) -> anyhow::Result<BackupConfigResponse> {
    let now = Utc::now();

    if let Some(interval) = req.interval_days {
        let clean_interval = interval.clamp(1, 365).to_string();
        sqlx::query(
            "INSERT INTO silantas.settings (key, value, updated_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;",
        )
        .bind(SETTING_KEY_INTERVAL)
        .bind(clean_interval)
        .bind(now)
        .execute(pool)
        .await?;
    }

    if let Some(auto) = req.auto_enabled {
        sqlx::query(
            "INSERT INTO silantas.settings (key, value, updated_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;",
        )
        .bind(SETTING_KEY_AUTO_ENABLED)
        .bind(if auto { "true" } else { "false" })
        .bind(now)
        .execute(pool)
        .await?;
    }

    if let Some(retention) = req.retention_count {
        let clean_retention = retention.clamp(1, 100).to_string();
        sqlx::query(
            "INSERT INTO silantas.settings (key, value, updated_at)
             VALUES ($1, $2, $3)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;",
        )
        .bind(SETTING_KEY_RETENTION)
        .bind(clean_retention)
        .bind(now)
        .execute(pool)
        .await?;
    }

    Ok(get_backup_config(pool).await)
}

/// Helper: List all backup files in the backup directory
pub fn list_backup_files() -> Vec<BackupFileItem> {
    let dir = get_backup_dir();
    let mut items = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(fname) = path.file_name().and_then(|n| n.to_str()) {
                    if fname.ends_with(".zip") || fname.ends_with(".sql") {
                        let metadata = entry.metadata().ok();
                        let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
                        let size_display = format_bytes(size_bytes);
                        
                        let created_at = metadata
                            .and_then(|m| m.created().or_else(|_| m.modified()).ok())
                            .map(|st| {
                                let dt: DateTime<Utc> = st.into();
                                dt.to_rfc3339()
                            })
                            .unwrap_or_else(|| Utc::now().to_rfc3339());

                        let trigger_type = if fname.to_lowercase().contains("auto") {
                            "AUTO".to_string()
                        } else {
                            "MANUAL".to_string()
                        };

                        let checksum = calculate_file_sha256(&path).unwrap_or_else(|_| "-".to_string());

                        items.push(BackupFileItem {
                            filename: fname.to_string(),
                            size_bytes,
                            size_display,
                            created_at,
                            trigger_type,
                            checksum_sha256: checksum,
                        });
                    }
                }
            }
        }
    }

    // Sort descending by filename / created_at (newest first)
    items.sort_by(|a, b| b.filename.cmp(&a.filename));
    items
}

/// Prune old backup files exceeding retention limit
pub fn prune_old_backups(backup_dir: &Path, max_retention: usize) -> anyhow::Result<usize> {
    if max_retention == 0 {
        return Ok(0);
    }

    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(backup_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(fname) = path.file_name().and_then(|n| n.to_str()) {
                    if fname.ends_with(".zip") || fname.ends_with(".sql") {
                        files.push(path);
                    }
                }
            }
        }
    }

    // Sort descending by filename
    files.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

    let mut deleted_count = 0;
    if files.len() > max_retention {
        for old_file in &files[max_retention..] {
            if let Ok(_) = fs::remove_file(old_file) {
                tracing::info!("Pruned old backup file: {:?}", old_file.file_name());
                deleted_count += 1;
            }
        }
    }

    Ok(deleted_count)
}

/// Helper to escape SQL string literals
fn escape_sql_string(val: &str) -> String {
    val.replace('\'', "''")
}

/// Fallback Pure-Rust Exporter that generates standard, universal portable SQL
pub async fn generate_portable_sql_backup(pool: &PgPool, out_path: &Path, trigger_type: &str) -> anyhow::Result<()> {
    let now = Utc::now();
    let mut sql = String::with_capacity(64 * 1024);

    sql.push_str("-- ========================================================\n");
    sql.push_str("-- SILANTAS - SISTEM INFORMASI LALU LINTAS HEWAN\n");
    sql.push_str("-- Universal Portable PostgreSQL Backup\n");
    sql.push_str(&format!("-- Generated At   : {}\n", now.to_rfc3339()));
    sql.push_str(&format!("-- Trigger Type   : {}\n", trigger_type.to_uppercase()));
    sql.push_str("-- Target Schema  : silantas\n");
    sql.push_str("-- Portability    : No hardcoded user roles, clean transactional\n");
    sql.push_str("-- ========================================================\n\n");

    sql.push_str("SET client_encoding = 'UTF8';\n");
    sql.push_str("SET standard_conforming_strings = on;\n");
    sql.push_str("SET check_function_bodies = false;\n");
    sql.push_str("SET client_min_messages = warning;\n\n");

    sql.push_str("BEGIN;\n\n");
    sql.push_str("CREATE SCHEMA IF NOT EXISTS silantas;\n");
    sql.push_str("SET search_path = silantas, public;\n\n");

    // 1. DDL: users
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.users\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.users (\n");
    sql.push_str("    id UUID PRIMARY KEY,\n");
    sql.push_str("    full_name VARCHAR(255) NOT NULL,\n");
    sql.push_str("    username VARCHAR(64) UNIQUE NOT NULL,\n");
    sql.push_str("    email VARCHAR(255) UNIQUE NOT NULL,\n");
    sql.push_str("    password_hash TEXT NOT NULL,\n");
    sql.push_str("    role VARCHAR(64) NOT NULL DEFAULT 'petugas',\n");
    sql.push_str("    is_active BOOLEAN NOT NULL DEFAULT true,\n");
    sql.push_str("    phone_number VARCHAR(50),\n");
    sql.push_str("    agency VARCHAR(255) DEFAULT 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika',\n");
    sql.push_str("    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n");
    sql.push_str("    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_users_email ON silantas.users(email);\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_users_username ON silantas.users(username);\n\n");

    // 2. DDL: traffic_records
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.traffic_records\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.traffic_records (\n");
    sql.push_str("    id UUID PRIMARY KEY,\n");
    sql.push_str("    record_number VARCHAR(100) NOT NULL,\n");
    sql.push_str("    traffic_type VARCHAR(20) NOT NULL,\n");
    sql.push_str("    category VARCHAR(50) NOT NULL,\n");
    sql.push_str("    item_name VARCHAR(255) NOT NULL,\n");
    sql.push_str("    quantity NUMERIC(12, 2) NOT NULL,\n");
    sql.push_str("    unit VARCHAR(50) NOT NULL,\n");
    sql.push_str("    origin VARCHAR(255) NOT NULL,\n");
    sql.push_str("    destination VARCHAR(255) NOT NULL,\n");
    sql.push_str("    transport_type VARCHAR(50) NOT NULL,\n");
    sql.push_str("    applicant_name VARCHAR(255) NOT NULL,\n");
    sql.push_str("    health_certificate_no VARCHAR(100),\n");
    sql.push_str("    inspection_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',\n");
    sql.push_str("    notes TEXT,\n");
    sql.push_str("    recorded_by UUID REFERENCES silantas.users(id),\n");
    sql.push_str("    traffic_date DATE NOT NULL DEFAULT CURRENT_DATE,\n");
    sql.push_str("    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n");
    sql.push_str("    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_traffic_date ON silantas.traffic_records(traffic_date);\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_traffic_type ON silantas.traffic_records(traffic_type);\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_traffic_category ON silantas.traffic_records(category);\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_traffic_item_name ON silantas.traffic_records(item_name);\n\n");

    // 3. DDL: traffic_attachments
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.traffic_attachments\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.traffic_attachments (\n");
    sql.push_str("    id UUID PRIMARY KEY,\n");
    sql.push_str("    traffic_id UUID NOT NULL REFERENCES silantas.traffic_records(id) ON DELETE CASCADE,\n");
    sql.push_str("    file_name VARCHAR(255) NOT NULL,\n");
    sql.push_str("    file_path VARCHAR(500) NOT NULL,\n");
    sql.push_str("    mime_type VARCHAR(100) NOT NULL,\n");
    sql.push_str("    file_size BIGINT NOT NULL,\n");
    sql.push_str("    uploaded_by UUID REFERENCES silantas.users(id),\n");
    sql.push_str("    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_traffic_attachments_traffic_id ON silantas.traffic_attachments(traffic_id);\n\n");

    // 4. DDL: whatsapp_recaps
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.whatsapp_recaps\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.whatsapp_recaps (\n");
    sql.push_str("    id UUID PRIMARY KEY,\n");
    sql.push_str("    ticket_id VARCHAR(50),\n");
    sql.push_str("    reporter_name VARCHAR(255) NOT NULL,\n");
    sql.push_str("    reporter_phone VARCHAR(50),\n");
    sql.push_str("    address TEXT NOT NULL,\n");
    sql.push_str("    service_type VARCHAR(50) NOT NULL,\n");
    sql.push_str("    description TEXT NOT NULL,\n");
    sql.push_str("    status VARCHAR(50) NOT NULL DEFAULT 'BARU',\n");
    sql.push_str("    recorded_by VARCHAR(255),\n");
    sql.push_str("    notes TEXT,\n");
    sql.push_str("    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n");
    sql.push_str("    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n\n");

    // 5. DDL: whatsapp_attachments
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.whatsapp_attachments\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.whatsapp_attachments (\n");
    sql.push_str("    id UUID PRIMARY KEY,\n");
    sql.push_str("    recap_id UUID REFERENCES silantas.whatsapp_recaps(id) ON DELETE CASCADE,\n");
    sql.push_str("    file_name VARCHAR(255) NOT NULL,\n");
    sql.push_str("    file_path VARCHAR(500) NOT NULL,\n");
    sql.push_str("    mime_type VARCHAR(100) NOT NULL,\n");
    sql.push_str("    file_size BIGINT NOT NULL,\n");
    sql.push_str("    uploaded_by UUID REFERENCES silantas.users(id),\n");
    sql.push_str("    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_whatsapp_attachments_recap_id ON silantas.whatsapp_attachments(recap_id);\n\n");

    // 6. DDL: audit_logs
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.audit_logs\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.audit_logs (\n");
    sql.push_str("    id UUID PRIMARY KEY,\n");
    sql.push_str("    user_id UUID REFERENCES silantas.users(id),\n");
    sql.push_str("    username VARCHAR(64) NOT NULL,\n");
    sql.push_str("    user_role VARCHAR(64) NOT NULL,\n");
    sql.push_str("    action VARCHAR(50) NOT NULL,\n");
    sql.push_str("    entity_type VARCHAR(50) NOT NULL,\n");
    sql.push_str("    entity_id VARCHAR(100),\n");
    sql.push_str("    description TEXT NOT NULL,\n");
    sql.push_str("    metadata JSONB,\n");
    sql.push_str("    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_audit_created_at ON silantas.audit_logs(created_at DESC);\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_audit_user ON silantas.audit_logs(user_id);\n");
    sql.push_str("CREATE INDEX IF NOT EXISTS idx_audit_entity ON silantas.audit_logs(entity_type, entity_id);\n\n");

    // 4. DDL: settings
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("-- Table structure for: silantas.settings\n");
    sql.push_str("-- --------------------------------------------------------\n");
    sql.push_str("CREATE TABLE IF NOT EXISTS silantas.settings (\n");
    sql.push_str("    key VARCHAR(100) PRIMARY KEY,\n");
    sql.push_str("    value TEXT NOT NULL,\n");
    sql.push_str("    description TEXT,\n");
    sql.push_str("    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n");
    sql.push_str(");\n\n");

    // --------------------------------------------------------
    // DATA DUMP: silantas.settings
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.settings\n");
    let settings_rows = sqlx::query("SELECT key, value, description, updated_at FROM silantas.settings;")
        .fetch_all(pool)
        .await
        .unwrap_or_default();

    for row in settings_rows {
        let key: String = row.get(0);
        let value: String = row.get(1);
        let desc: Option<String> = row.get(2);
        let updated_at: DateTime<Utc> = row.get(3);

        let desc_sql = match desc {
            Some(d) => format!("'{}'", escape_sql_string(&d)),
            None => "NULL".to_string(),
        };

        sql.push_str(&format!(
            "INSERT INTO silantas.settings (key, value, description, updated_at) VALUES ('{}', '{}', {}, '{}') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = EXCLUDED.updated_at;\n",
            escape_sql_string(&key),
            escape_sql_string(&value),
            desc_sql,
            updated_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    // --------------------------------------------------------
    // DATA DUMP: silantas.users
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.users\n");
    let users_rows = sqlx::query(
        "SELECT id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at FROM silantas.users;"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for row in users_rows {
        let id: Uuid = row.get(0);
        let full_name: String = row.get(1);
        let username: String = row.get(2);
        let email: String = row.get(3);
        let pwd_hash: String = row.get(4);
        let role: String = row.get(5);
        let is_active: bool = row.get(6);
        let phone: Option<String> = row.get(7);
        let agency: Option<String> = row.get(8);
        let created_at: DateTime<Utc> = row.get(9);
        let updated_at: DateTime<Utc> = row.get(10);

        let phone_sql = phone.map(|p| format!("'{}'", escape_sql_string(&p))).unwrap_or_else(|| "NULL".to_string());
        let agency_sql = agency.map(|a| format!("'{}'", escape_sql_string(&a))).unwrap_or_else(|| "NULL".to_string());

        sql.push_str(&format!(
            "INSERT INTO silantas.users (id, full_name, username, email, password_hash, role, is_active, phone_number, agency, created_at, updated_at) VALUES ('{}', '{}', '{}', '{}', '{}', '{}', {}, {}, {}, '{}', '{}') ON CONFLICT (id) DO NOTHING;\n",
            id,
            escape_sql_string(&full_name),
            escape_sql_string(&username),
            escape_sql_string(&email),
            escape_sql_string(&pwd_hash),
            escape_sql_string(&role),
            if is_active { "TRUE" } else { "FALSE" },
            phone_sql,
            agency_sql,
            created_at.to_rfc3339(),
            updated_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    // --------------------------------------------------------
    // DATA DUMP: silantas.traffic_records
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.traffic_records\n");
    let traffic_rows = sqlx::query(
        "SELECT id, record_number, traffic_type, category, item_name, quantity::TEXT, unit, origin, destination, transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, traffic_date, created_at, updated_at FROM silantas.traffic_records;"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for row in traffic_rows {
        let id: Uuid = row.get(0);
        let rec_no: String = row.get(1);
        let t_type: String = row.get(2);
        let cat: String = row.get(3);
        let item: String = row.get(4);
        let qty: String = row.get(5);
        let unit: String = row.get(6);
        let orig: String = row.get(7);
        let dest: String = row.get(8);
        let trans: String = row.get(9);
        let applicant: String = row.get(10);
        let cert: Option<String> = row.get(11);
        let insp: String = row.get(12);
        let notes: Option<String> = row.get(13);
        let recorded_by: Option<Uuid> = row.get(14);
        let t_date: chrono::NaiveDate = row.get(15);
        let created_at: DateTime<Utc> = row.get(16);
        let updated_at: DateTime<Utc> = row.get(17);

        let cert_sql = cert.map(|c| format!("'{}'", escape_sql_string(&c))).unwrap_or_else(|| "NULL".to_string());
        let notes_sql = notes.map(|n| format!("'{}'", escape_sql_string(&n))).unwrap_or_else(|| "NULL".to_string());
        let rec_by_sql = recorded_by.map(|u| format!("'{}'", u)).unwrap_or_else(|| "NULL".to_string());

        sql.push_str(&format!(
            "INSERT INTO silantas.traffic_records (id, record_number, traffic_type, category, item_name, quantity, unit, origin, destination, transport_type, applicant_name, health_certificate_no, inspection_status, notes, recorded_by, traffic_date, created_at, updated_at) VALUES ('{}', '{}', '{}', '{}', '{}', {}, '{}', '{}', '{}', '{}', '{}', {}, '{}', {}, {}, '{}', '{}', '{}') ON CONFLICT (id) DO NOTHING;\n",
            id,
            escape_sql_string(&rec_no),
            escape_sql_string(&t_type),
            escape_sql_string(&cat),
            escape_sql_string(&item),
            qty,
            escape_sql_string(&unit),
            escape_sql_string(&orig),
            escape_sql_string(&dest),
            escape_sql_string(&trans),
            escape_sql_string(&applicant),
            cert_sql,
            escape_sql_string(&insp),
            notes_sql,
            rec_by_sql,
            t_date,
            created_at.to_rfc3339(),
            updated_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    // --------------------------------------------------------
    // DATA DUMP: silantas.traffic_attachments
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.traffic_attachments\n");
    let traffic_att_rows = sqlx::query(
        "SELECT id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at FROM silantas.traffic_attachments ORDER BY created_at ASC;"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for row in traffic_att_rows {
        let id: Uuid = row.get(0);
        let traffic_id: Uuid = row.get(1);
        let file_name: String = row.get(2);
        let file_path: String = row.get(3);
        let mime_type: String = row.get(4);
        let file_size: i64 = row.get(5);
        let uploaded_by: Option<Uuid> = row.get(6);
        let created_at: DateTime<Utc> = row.get(7);

        let up_by_sql = uploaded_by.map(|u| format!("'{}'", u)).unwrap_or_else(|| "NULL".to_string());

        sql.push_str(&format!(
            "INSERT INTO silantas.traffic_attachments (id, traffic_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at) VALUES ('{}', '{}', '{}', '{}', '{}', {}, {}, '{}') ON CONFLICT (id) DO NOTHING;\n",
            id,
            traffic_id,
            escape_sql_string(&file_name),
            escape_sql_string(&file_path),
            escape_sql_string(&mime_type),
            file_size,
            up_by_sql,
            created_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    // --------------------------------------------------------
    // DATA DUMP: silantas.whatsapp_recaps
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.whatsapp_recaps\n");
    let wa_recaps_rows = sqlx::query(
        "SELECT id, ticket_id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at FROM silantas.whatsapp_recaps ORDER BY created_at ASC;"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for row in wa_recaps_rows {
        let id: Uuid = row.get(0);
        let ticket_id: Option<String> = row.get(1);
        let reporter_name: String = row.get(2);
        let reporter_phone: Option<String> = row.get(3);
        let address: String = row.get(4);
        let service_type: String = row.get(5);
        let description: String = row.get(6);
        let status: String = row.get(7);
        let recorded_by: Option<String> = row.get(8);
        let notes: Option<String> = row.get(9);
        let created_at: DateTime<Utc> = row.get(10);
        let updated_at: DateTime<Utc> = row.get(11);

        let ticket_sql = ticket_id.map(|t| format!("'{}'", escape_sql_string(&t))).unwrap_or_else(|| "NULL".to_string());
        let phone_sql = reporter_phone.map(|p| format!("'{}'", escape_sql_string(&p))).unwrap_or_else(|| "NULL".to_string());
        let rec_by_sql = recorded_by.map(|r| format!("'{}'", escape_sql_string(&r))).unwrap_or_else(|| "NULL".to_string());
        let notes_sql = notes.map(|n| format!("'{}'", escape_sql_string(&n))).unwrap_or_else(|| "NULL".to_string());

        sql.push_str(&format!(
            "INSERT INTO silantas.whatsapp_recaps (id, ticket_id, reporter_name, reporter_phone, address, service_type, description, status, recorded_by, notes, created_at, updated_at) VALUES ('{}', {}, '{}', {}, '{}', '{}', '{}', '{}', {}, {}, '{}', '{}') ON CONFLICT (id) DO NOTHING;\n",
            id,
            ticket_sql,
            escape_sql_string(&reporter_name),
            phone_sql,
            escape_sql_string(&address),
            escape_sql_string(&service_type),
            escape_sql_string(&description),
            escape_sql_string(&status),
            rec_by_sql,
            notes_sql,
            created_at.to_rfc3339(),
            updated_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    // --------------------------------------------------------
    // DATA DUMP: silantas.whatsapp_attachments
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.whatsapp_attachments\n");
    let wa_att_rows = sqlx::query(
        "SELECT id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at FROM silantas.whatsapp_attachments ORDER BY created_at ASC;"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for row in wa_att_rows {
        let id: Uuid = row.get(0);
        let recap_id: Option<Uuid> = row.get(1);
        let file_name: String = row.get(2);
        let file_path: String = row.get(3);
        let mime_type: String = row.get(4);
        let file_size: i64 = row.get(5);
        let uploaded_by: Option<Uuid> = row.get(6);
        let created_at: DateTime<Utc> = row.get(7);

        let recap_id_sql = recap_id.map(|r| format!("'{}'", r)).unwrap_or_else(|| "NULL".to_string());
        let up_by_sql = uploaded_by.map(|u| format!("'{}'", u)).unwrap_or_else(|| "NULL".to_string());

        sql.push_str(&format!(
            "INSERT INTO silantas.whatsapp_attachments (id, recap_id, file_name, file_path, mime_type, file_size, uploaded_by, created_at) VALUES ('{}', {}, '{}', '{}', '{}', {}, {}, '{}') ON CONFLICT (id) DO NOTHING;\n",
            id,
            recap_id_sql,
            escape_sql_string(&file_name),
            escape_sql_string(&file_path),
            escape_sql_string(&mime_type),
            file_size,
            up_by_sql,
            created_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    // --------------------------------------------------------
    // DATA DUMP: silantas.audit_logs
    // --------------------------------------------------------
    sql.push_str("-- Data dump for: silantas.audit_logs\n");
    let audit_rows = sqlx::query(
        "SELECT id, user_id, username, user_role, action, entity_type, entity_id, description, metadata, created_at FROM silantas.audit_logs ORDER BY created_at ASC;"
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    for row in audit_rows {
        let id: Uuid = row.get(0);
        let user_id: Option<Uuid> = row.get(1);
        let username: String = row.get(2);
        let role: String = row.get(3);
        let act: String = row.get(4);
        let ent_type: String = row.get(5);
        let ent_id: Option<String> = row.get(6);
        let desc: String = row.get(7);
        let meta: Option<serde_json::Value> = row.get(8);
        let created_at: DateTime<Utc> = row.get(9);

        let user_id_sql = user_id.map(|u| format!("'{}'", u)).unwrap_or_else(|| "NULL".to_string());
        let ent_id_sql = ent_id.map(|e| format!("'{}'", escape_sql_string(&e))).unwrap_or_else(|| "NULL".to_string());
        let meta_sql = meta.map(|m| format!("'{}'::jsonb", escape_sql_string(&m.to_string()))).unwrap_or_else(|| "NULL".to_string());

        sql.push_str(&format!(
            "INSERT INTO silantas.audit_logs (id, user_id, username, user_role, action, entity_type, entity_id, description, metadata, created_at) VALUES ('{}', {}, '{}', '{}', '{}', '{}', {}, '{}', {}, '{}') ON CONFLICT (id) DO NOTHING;\n",
            id,
            user_id_sql,
            escape_sql_string(&username),
            escape_sql_string(&role),
            escape_sql_string(&act),
            escape_sql_string(&ent_type),
            ent_id_sql,
            escape_sql_string(&desc),
            meta_sql,
            created_at.to_rfc3339()
        ));
    }
    sql.push('\n');

    sql.push_str("COMMIT;\n");
    sql.push_str("-- ========================================================\n");
    sql.push_str("-- BACKUP FINISHED SUCCESSFULLY\n");
    sql.push_str("-- ========================================================\n");

    let mut file = File::create(out_path)?;
    file.write_all(sql.as_bytes())?;
    Ok(())
}

/// Try running pg_dump with universal portable flags
fn try_pg_dump(config: &Config, out_path: &Path) -> Result<(), String> {
    let pg_dump_cmd = "pg_dump";
    let db_url = &config.database_url;

    let mut cmd = Command::new(pg_dump_cmd);
    cmd.arg("--dbname").arg(db_url)
        .arg("--format=plain")
        .arg("--clean")
        .arg("--if-exists")
        .arg("--no-owner")
        .arg("--no-privileges")
        .arg("--schema=silantas")
        .arg("--encoding=UTF8")
        .arg("--file").arg(out_path);

    let output = cmd.output().map_err(|e| format!("pg_dump invocation failed: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("pg_dump returned non-zero exit code: {stderr}"));
    }

    Ok(())
}

/// Helper to zip database SQL, uploads folder, manifest, and restoration guide into a unified backup package
pub fn package_backup_zip(
    sql_path: &Path,
    zip_path: &Path,
    trigger_type: &str,
    db_checksum: &str,
) -> anyhow::Result<(u64, String, usize, u64)> {
    let zip_file = File::create(zip_path)?;
    let mut zip = ZipWriter::new(zip_file);
    let file_options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // 1. Add database.sql
    zip.start_file("database.sql", file_options)?;
    let mut sql_file = File::open(sql_path)?;
    std::io::copy(&mut sql_file, &mut zip)?;

    // 2. Discover and add all uploads
    let uploads_root = PathBuf::from(std::env::var("UPLOADS_BASE_DIR").unwrap_or_else(|_| "./uploads".to_string()));
    let mut packed_files: Vec<String> = Vec::new();
    let mut total_upload_bytes: u64 = 0;

    fn walk_directory(
        current_dir: &Path,
        root_dir: &Path,
        files_out: &mut Vec<(PathBuf, String)>,
    ) {
        if let Ok(entries) = fs::read_dir(current_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Ok(rel) = path.strip_prefix(root_dir) {
                        let normalized_rel = format!("uploads/{}", rel.to_string_lossy().replace('\\', "/"));
                        files_out.push((path, normalized_rel));
                    }
                } else if path.is_dir() {
                    walk_directory(&path, root_dir, files_out);
                }
            }
        }
    }

    if uploads_root.exists() && uploads_root.is_dir() {
        let mut upload_items = Vec::new();
        walk_directory(&uploads_root, &uploads_root, &mut upload_items);

        for (disk_path, entry_name) in upload_items {
            if let Ok(mut f) = File::open(&disk_path) {
                if let Ok(meta) = f.metadata() {
                    total_upload_bytes += meta.len();
                }
                zip.start_file(&entry_name, file_options)?;
                std::io::copy(&mut f, &mut zip)?;
                packed_files.push(entry_name);
            }
        }
    }

    // 3. Add manifest.json
    let now = Utc::now();
    let manifest = serde_json::json!({
        "system": "SUANGGI - SILANTAS HEWAN MIMIKA",
        "description": "Arsip Cadangan Terpadu Basis Data dan Berkas Lampiran Fisik",
        "version": "2.0",
        "createdAt": now.to_rfc3339(),
        "triggerType": trigger_type.to_uppercase(),
        "databaseFile": "database.sql",
        "databaseSha256": db_checksum,
        "totalUploadedFiles": packed_files.len(),
        "totalUploadedBytes": total_upload_bytes,
        "uploadedFiles": packed_files,
    });
    zip.start_file("manifest.json", file_options)?;
    zip.write_all(serde_json::to_string_pretty(&manifest)?.as_bytes())?;

    // 4. Add MIGRATION_GUIDE.txt
    let guide = format!(
r#"================================================================================
SUANGGI (SILANTAS) - PANDUAN LENGKAP RESTORASI DAN MIGRASI DATA
================================================================================
Arsip cadangan ini memuat snapshot lengkap dari sistem SUANGGI (SILANTAS), mencakup:
1. Skema dan seluruh data basis data PostgreSQL (database.sql).
2. Seluruh berkas fisik lampiran dokumen lalu lintas hewan (surat rekomendasi, SKKH, SV, dsb).
3. Seluruh berkas fisik tangkapan layar aduan/laporan WhatsApp (uploads/whatsapp_attachments).

INFORMASI ARSIP:
- Tanggal Dibuat        : {}
- Tipe Pemicu           : {}
- SHA-256 Basis Data    : {}
- Jumlah Berkas Upload  : {} berkas ({})

STRUKTUR ISI ARSIP ZIP:
├── database.sql                    (Dump lengkap PostgreSQL schema silantas)
├── manifest.json                   (Metadata verifikasi dan daftar berkas)
├── MIGRATION_GUIDE.txt             (Petunjuk ini)
└── uploads/
    ├── traffic_attachments/        (Sertifikat Veteriner, SKKH, dsb)
    └── whatsapp_attachments/       (Tangkapan layar pengaduan WhatsApp)

--------------------------------------------------------------------------------
LANGKAH MIGRASI / PEMULIHAN KE SERVER BARU:
--------------------------------------------------------------------------------
Langkah 1: Ekstrak seluruh isi arsip ZIP ke folder aplikasi backend Silantas:
   # Contoh pada Linux / macOS / PowerShell:
   unzip suanggi_backup_xxx.zip -d /path/ke/backend/

   *Catatan penting*:
   Folder `uploads/` akan otomatis menempati posisi `./uploads/` pada backend.
   Seluruh referensi path di basis data (misalnya: 'uploads/traffic_attachments/xxx.pdf'
   atau 'uploads/whatsapp_attachments/yyy.png') akan langsung cocok 100% secara presisi
   tanpa perlu mengubah nama atau jalur berkas di basis data!

Langkah 2: Impor berkas SQL ke server PostgreSQL baru:
   psql -h <HOST_DB> -U <USER_DB> -d <NAMA_DB> -f database.sql

   *Atau melalui pgAdmin / DBeaver*:
   Buka file database.sql di Query Tool, lalu klik tombol 'Execute'.

Langkah 3: Jalankan aplikasi Silantas Backend.
   Semua data rekapan lalu lintas, aduan WhatsApp, dan berkas lampiran
   dapat langsung diakses dan diunduh seperti sedia kala!
================================================================================
"#,
        now.to_rfc3339(),
        trigger_type.to_uppercase(),
        db_checksum,
        packed_files.len(),
        format_bytes(total_upload_bytes)
    );

    zip.start_file("MIGRATION_GUIDE.txt", file_options)?;
    zip.write_all(guide.as_bytes())?;

    // 5. Finalize archive
    zip.finish()?;

    // 6. Compute stats of the resulting .zip file
    let zip_size = fs::metadata(zip_path)?.len();
    let zip_checksum = calculate_file_sha256(zip_path)?;

    Ok((zip_size, zip_checksum, packed_files.len(), total_upload_bytes))
}

/// Generate database backup (pg_dump with fallback to native exporter, packaged as .zip with uploads)
pub async fn create_database_backup(
    pool: &PgPool,
    config: &Config,
    trigger_type: &str,
) -> anyhow::Result<BackupFileItem> {
    let dir = get_backup_dir();
    let now = Utc::now();
    let timestamp = now.format("%Y%m%d_%H%M%S");
    let zip_filename = format!(
        "suanggi_backup_{}_{}.zip",
        timestamp,
        trigger_type.to_lowercase()
    );
    let target_zip_path = dir.join(&zip_filename);

    let temp_sql_filename = format!(
        ".temp_suanggi_{}_{}.sql",
        timestamp,
        trigger_type.to_lowercase()
    );
    let temp_sql_path = dir.join(&temp_sql_filename);

    tracing::info!("Starting database backup -> target zip: {}", target_zip_path.display());

    // 1. Attempt pg_dump first for best performance
    let dump_result = try_pg_dump(config, &temp_sql_path);
    if let Err(e) = dump_result {
        tracing::warn!("pg_dump not available or failed ({e}). Falling back to Silantas native SQL exporter.");
        generate_portable_sql_backup(pool, &temp_sql_path, trigger_type).await?;
    }

    // 2. Compute checksum of the raw SQL dump
    let db_checksum = calculate_file_sha256(&temp_sql_path)?;

    // 3. Package database.sql + uploads/ + manifest.json + MIGRATION_GUIDE.txt into the zip archive
    let (zip_size, zip_checksum, upload_count, upload_bytes) = package_backup_zip(
        &temp_sql_path,
        &target_zip_path,
        trigger_type,
        &db_checksum,
    )?;

    // 4. Remove intermediate raw SQL file to keep the backup directory clean
    let _ = fs::remove_file(&temp_sql_path);

    let size_display = format_bytes(zip_size);

    // 5. Update backup status in silantas.settings
    let _ = sqlx::query(
        "INSERT INTO silantas.settings (key, value, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;",
    )
    .bind(SETTING_KEY_LAST_RUN)
    .bind(now.to_rfc3339())
    .bind(now)
    .execute(pool)
    .await;

    let _ = sqlx::query(
        "INSERT INTO silantas.settings (key, value, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;",
    )
    .bind(SETTING_KEY_LAST_STATUS)
    .bind("SUCCESS")
    .bind(now)
    .execute(pool)
    .await;

    // 6. Prune old backups based on retention policy
    let config_state = get_backup_config(pool).await;
    let _ = prune_old_backups(&dir, config_state.retention_count as usize);

    tracing::info!(
        "Unified backup archive created: {} ({}, uploads: {} files / {}, SHA256: {})",
        zip_filename,
        size_display,
        upload_count,
        format_bytes(upload_bytes),
        &zip_checksum[..8]
    );

    Ok(BackupFileItem {
        filename: zip_filename,
        size_bytes: zip_size,
        size_display,
        created_at: now.to_rfc3339(),
        trigger_type: trigger_type.to_uppercase(),
        checksum_sha256: zip_checksum,
    })
}

/// Fetch complete database telemetry, storage statistics, and backup status
pub async fn get_database_status(pool: &PgPool) -> anyhow::Result<DatabaseStatusResponse> {
    // 1. Version
    let db_version: String = sqlx::query_scalar("SELECT version();")
        .fetch_one(pool)
        .await
        .unwrap_or_else(|_| "PostgreSQL (Unknown version)".to_string());

    // 2. Database Name
    let db_name: String = sqlx::query_scalar("SELECT current_database();")
        .fetch_one(pool)
        .await
        .unwrap_or_else(|_| "postgres".to_string());

    // 3. Database Size
    let (db_size_bytes, db_size_pretty): (i64, String) = sqlx::query_as(
        "SELECT pg_database_size(current_database()) AS size_bytes, 
                pg_size_pretty(pg_database_size(current_database())) AS size_pretty;",
    )
    .fetch_one(pool)
    .await
    .unwrap_or((0, "0 B".to_string()));

    // 4. Active Connections
    let active_conns: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();",
    )
    .fetch_one(pool)
    .await
    .unwrap_or(1);

    // 5. Table Statistics in silantas schema
    let table_queries = sqlx::query(
        "SELECT 
            c.relname::TEXT AS table_name,
            c.reltuples::BIGINT AS estimated_rows,
            pg_size_pretty(pg_total_relation_size(c.oid))::TEXT AS total_size,
            pg_size_pretty(pg_relation_size(c.oid))::TEXT AS table_size,
            pg_size_pretty(pg_indexes_size(c.oid))::TEXT AS index_size
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = 'silantas' AND c.relkind = 'r'
         ORDER BY pg_total_relation_size(c.oid) DESC;",
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    let mut tables = Vec::new();
    for row in table_queries {
        tables.push(TableStatItem {
            table_name: row.get(0),
            estimated_rows: row.get::<i64, _>(1).max(0),
            total_size: row.get(2),
            table_size: row.get(3),
            index_size: row.get(4),
        });
    }

    // 6. Backup storage status
    let backup_files = list_backup_files();
    let total_backups = backup_files.len();
    let total_backup_bytes: u64 = backup_files.iter().map(|f| f.size_bytes).sum();
    let total_backup_size_display = format_bytes(total_backup_bytes);

    // 7. Backup configuration
    let config = get_backup_config(pool).await;

    Ok(DatabaseStatusResponse {
        database_name: db_name,
        database_version: db_version,
        database_size: db_size_pretty,
        database_size_bytes: db_size_bytes,
        active_connections: active_conns,
        config,
        tables,
        total_backups,
        total_backup_bytes,
        total_backup_size_display,
    })
}

/// Helper function to check if auto-backup is due
pub fn is_auto_backup_due(config: &BackupConfigResponse, now: DateTime<Utc>) -> bool {
    if !config.auto_enabled {
        return false;
    }

    match &config.last_run {
        Some(lr) => match DateTime::parse_from_rfc3339(lr) {
            Ok(last_dt) => {
                let diff = now.signed_duration_since(last_dt.with_timezone(&Utc));
                diff >= chrono::Duration::days(config.interval_days as i64)
            }
            Err(_) => true,
        },
        None => true, // Never run before -> due immediately
    }
}

/// Tokio background task that runs periodic checks for automated backup
pub async fn start_backup_scheduler(pool: PgPool, config: Config) {
    tracing::info!("Backup scheduler task initialized. Checking every 30 minutes.");

    loop {
        let now = Utc::now();
        let backup_config = get_backup_config(&pool).await;

        if is_auto_backup_due(&backup_config, now) {
            tracing::info!(
                "Auto backup is due (Interval: {} days). Triggering scheduled backup...",
                backup_config.interval_days
            );

            match create_database_backup(&pool, &config, "AUTO").await {
                Ok(file) => {
                    tracing::info!("Scheduled auto backup completed: {}", file.filename);
                    record_audit_log(
                        &pool,
                        None,
                        "SYSTEM_SCHEDULER",
                        "system",
                        "BACKUP_AUTO",
                        "DATABASE",
                        Some(&file.filename),
                        &format!("Cadangan otomatis basis data ({}) berhasil dibuat", file.filename),
                        Some(serde_json::json!({
                            "filename": file.filename,
                            "size": file.size_display,
                            "checksum": file.checksum_sha256,
                            "intervalDays": backup_config.interval_days
                        })),
                    )
                    .await;
                }
                Err(e) => {
                    tracing::error!("Scheduled auto backup failed: {e}");
                    let _ = sqlx::query(
                        "INSERT INTO silantas.settings (key, value, updated_at)
                         VALUES ($1, $2, $3)
                         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;",
                    )
                    .bind(SETTING_KEY_LAST_STATUS)
                    .bind(format!("FAILED: {e}"))
                    .bind(now)
                    .execute(&pool)
                    .await;
                }
            }
        }

        // Sleep for 30 minutes before next evaluation
        tokio::time::sleep(Duration::from_secs(1800)).await;
    }
}
