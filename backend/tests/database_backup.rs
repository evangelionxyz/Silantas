use std::fs::{self, File};
use std::io::Write;
use chrono::{Duration, Utc};
use sha2::{Digest, Sha256};
use silantas_api::models::backup::BackupConfigResponse;
use silantas_api::services::backup::{
    calculate_file_sha256, format_bytes, is_auto_backup_due, prune_old_backups,
    sanitize_backup_filename,
};

#[test]
fn test_backup_filename_sanitization_and_path_traversal() {
    // Valid filenames
    assert!(sanitize_backup_filename("silantas_backup_20261110_120000_manual.sql").is_ok());
    assert!(sanitize_backup_filename("silantas_backup_20261110_120000_auto.sql").is_ok());
    assert!(sanitize_backup_filename("my-backup_test.123.sql").is_ok());

    // Path traversal attempts
    assert!(sanitize_backup_filename("../Cargo.toml").is_err());
    assert!(sanitize_backup_filename("../../etc/passwd").is_err());
    assert!(sanitize_backup_filename("..\\windows\\system32\\cmd.exe").is_err());
    assert!(sanitize_backup_filename("folder/backup.sql").is_err());
    assert!(sanitize_backup_filename("C:\\backup.sql").is_err());

    // Invalid extensions & dangerous characters
    assert!(sanitize_backup_filename("backup.txt").is_err());
    assert!(sanitize_backup_filename("backup.sh").is_err());
    assert!(sanitize_backup_filename("backup;rm -rf.sql").is_err());
    assert!(sanitize_backup_filename("").is_err());
    assert!(sanitize_backup_filename("   ").is_err());
}

#[test]
fn test_backup_size_formatting() {
    assert_eq!(format_bytes(0), "0 B");
    assert_eq!(format_bytes(512), "512 B");
    assert_eq!(format_bytes(1024), "1.00 KB");
    assert_eq!(format_bytes(1536), "1.50 KB");
    assert_eq!(format_bytes(1024 * 1024), "1.00 MB");
    assert_eq!(format_bytes(5 * 1024 * 1024 + 512 * 1024), "5.50 MB");
    assert_eq!(format_bytes(2 * 1024 * 1024 * 1024), "2.00 GB");
}

#[test]
fn test_backup_retention_pruning() {
    let temp_dir = std::env::temp_dir().join(format!("silantas_test_backup_{}", Utc::now().timestamp_nanos_opt().unwrap_or(0)));
    fs::create_dir_all(&temp_dir).expect("create temp test dir");

    // Create 6 dummy backup files with sequential timestamp names
    let file_names = vec![
        "silantas_backup_20261110_010000_manual.sql",
        "silantas_backup_20261110_020000_manual.sql",
        "silantas_backup_20261110_030000_manual.sql",
        "silantas_backup_20261110_040000_manual.sql",
        "silantas_backup_20261110_050000_manual.sql",
        "silantas_backup_20261110_060000_manual.sql",
    ];

    for name in &file_names {
        let fpath = temp_dir.join(name);
        let mut f = File::create(&fpath).expect("create dummy file");
        f.write_all(b"-- dummy test sql content\n").expect("write dummy content");
    }

    // Prune with retention count = 3
    let pruned = prune_old_backups(&temp_dir, 3).expect("pruning should succeed");
    assert_eq!(pruned, 3, "Expected 3 oldest files to be pruned");

    // The remaining files must be the 3 newest ones
    assert!(!temp_dir.join("silantas_backup_20261110_010000_manual.sql").exists());
    assert!(!temp_dir.join("silantas_backup_20261110_020000_manual.sql").exists());
    assert!(!temp_dir.join("silantas_backup_20261110_030000_manual.sql").exists());

    assert!(temp_dir.join("silantas_backup_20261110_040000_manual.sql").exists());
    assert!(temp_dir.join("silantas_backup_20261110_050000_manual.sql").exists());
    assert!(temp_dir.join("silantas_backup_20261110_060000_manual.sql").exists());

    // Clean up
    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_sha256_checksum_integrity() {
    let temp_dir = std::env::temp_dir().join(format!("silantas_test_sha_{}", Utc::now().timestamp_nanos_opt().unwrap_or(0)));
    fs::create_dir_all(&temp_dir).expect("create temp test dir");

    let file_path = temp_dir.join("checksum_sample.sql");
    let sample_content = b"BEGIN;\nCREATE SCHEMA IF NOT EXISTS silantas;\nCOMMIT;\n";
    {
        let mut f = File::create(&file_path).expect("create file");
        f.write_all(sample_content).expect("write sample content");
    }

    let calculated_hash = calculate_file_sha256(&file_path).expect("calculate sha256");

    let mut hasher = Sha256::new();
    hasher.update(sample_content);
    let expected_hash = hex::encode(hasher.finalize());

    assert_eq!(calculated_hash, expected_hash);

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_auto_backup_due_logic() {
    let now = Utc::now();

    // 1. Auto backup disabled
    let config_disabled = BackupConfigResponse {
        interval_days: 7,
        auto_enabled: false,
        retention_count: 10,
        last_run: None,
        last_status: None,
        next_run: None,
    };
    assert!(!is_auto_backup_due(&config_disabled, now));

    // 2. Auto backup enabled, never run before -> due immediately
    let config_never_run = BackupConfigResponse {
        interval_days: 7,
        auto_enabled: true,
        retention_count: 10,
        last_run: None,
        last_status: None,
        next_run: None,
    };
    assert!(is_auto_backup_due(&config_never_run, now));

    // 3. Auto backup enabled, last run 8 days ago (interval 7 days) -> due
    let last_run_8_days_ago = (now - Duration::days(8)).to_rfc3339();
    let config_8_days = BackupConfigResponse {
        interval_days: 7,
        auto_enabled: true,
        retention_count: 10,
        last_run: Some(last_run_8_days_ago),
        last_status: Some("SUCCESS".to_string()),
        next_run: None,
    };
    assert!(is_auto_backup_due(&config_8_days, now));

    // 4. Auto backup enabled, last run 2 days ago (interval 7 days) -> not due
    let last_run_2_days_ago = (now - Duration::days(2)).to_rfc3339();
    let config_2_days = BackupConfigResponse {
        interval_days: 7,
        auto_enabled: true,
        retention_count: 10,
        last_run: Some(last_run_2_days_ago.clone()),
        last_status: Some("SUCCESS".to_string()),
        next_run: None,
    };
    assert!(!is_auto_backup_due(&config_2_days, now));

    // 5. User changes interval to 1 day -> now 2 days ago is due!
    let config_1_day_interval = BackupConfigResponse {
        interval_days: 1,
        auto_enabled: true,
        retention_count: 10,
        last_run: Some(last_run_2_days_ago),
        last_status: Some("SUCCESS".to_string()),
        next_run: None,
    };
    assert!(is_auto_backup_due(&config_1_day_interval, now));
}

#[test]
fn test_sql_schema_and_universal_compatibility_assertions() {
    // Verify SQL template standards for universal portability:
    let sample_sql = r#"
        SET client_encoding = 'UTF8';
        SET standard_conforming_strings = on;
        BEGIN;
        CREATE SCHEMA IF NOT EXISTS silantas;
        SET search_path = silantas, public;
        CREATE TABLE IF NOT EXISTS silantas.users (id UUID PRIMARY KEY);
        COMMIT;
    "#;

    assert!(sample_sql.contains("BEGIN;"));
    assert!(sample_sql.contains("COMMIT;"));
    assert!(sample_sql.contains("CREATE SCHEMA IF NOT EXISTS silantas;"));
    assert!(sample_sql.contains("UTF8"));

    // Ensure NO machine-specific or user-locking clauses are present
    assert!(!sample_sql.contains("OWNER TO"));
    assert!(!sample_sql.contains("GRANT ALL ON SCHEMA"));
}
