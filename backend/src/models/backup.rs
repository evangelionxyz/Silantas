use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupConfigResponse {
    pub interval_days: u32,
    pub auto_enabled: bool,
    pub retention_count: u32,
    pub last_run: Option<String>,
    pub last_status: Option<String>,
    pub next_run: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBackupConfigRequest {
    pub interval_days: Option<u32>,
    pub auto_enabled: Option<bool>,
    pub retention_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupFileItem {
    pub filename: String,
    pub size_bytes: u64,
    pub size_display: String,
    pub created_at: String,
    pub trigger_type: String, // "AUTO" | "MANUAL"
    pub checksum_sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TableStatItem {
    pub table_name: String,
    pub estimated_rows: i64,
    pub total_size: String,
    pub table_size: String,
    pub index_size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatabaseStatusResponse {
    pub database_name: String,
    pub database_version: String,
    pub database_size: String,
    pub database_size_bytes: i64,
    pub active_connections: i64,
    pub config: BackupConfigResponse,
    pub tables: Vec<TableStatItem>,
    pub total_backups: usize,
    pub total_backup_bytes: u64,
    pub total_backup_size_display: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateBackupResponse {
    pub message: String,
    pub file: BackupFileItem,
}
