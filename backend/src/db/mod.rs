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

        -- Create Users Table
        CREATE TABLE IF NOT EXISTS silantas.users (
            id UUID PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            username VARCHAR(64) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role VARCHAR(64) NOT NULL DEFAULT 'petugas',
            is_active BOOLEAN NOT NULL DEFAULT true,
            phone_number VARCHAR(50),
            agency VARCHAR(255) DEFAULT 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON silantas.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON silantas.users(username);

        ALTER TABLE silantas.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
        ALTER TABLE silantas.users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
        ALTER TABLE silantas.users ADD COLUMN IF NOT EXISTS agency VARCHAR(255) DEFAULT 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika';

        -- Create Traffic Records Table
        CREATE TABLE IF NOT EXISTS silantas.traffic_records (
            id UUID PRIMARY KEY,
            record_number VARCHAR(100) NOT NULL,
            traffic_type VARCHAR(20) NOT NULL,
            category VARCHAR(50) NOT NULL,
            item_name VARCHAR(255) NOT NULL,
            quantity NUMERIC(12, 2) NOT NULL,
            unit VARCHAR(50) NOT NULL,
            origin VARCHAR(255) NOT NULL,
            destination VARCHAR(255) NOT NULL,
            transport_type VARCHAR(50) NOT NULL,
            applicant_name VARCHAR(255) NOT NULL,
            health_certificate_no VARCHAR(100),
            inspection_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            notes TEXT,
            recorded_by UUID REFERENCES silantas.users(id),
            traffic_date DATE NOT NULL DEFAULT CURRENT_DATE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create Traffic Attachments Table
        CREATE TABLE IF NOT EXISTS silantas.traffic_attachments (
            id UUID PRIMARY KEY,
            traffic_id UUID NOT NULL REFERENCES silantas.traffic_records(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_size BIGINT NOT NULL,
            uploaded_by UUID REFERENCES silantas.users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_traffic_attachments_traffic_id ON silantas.traffic_attachments(traffic_id);

        -- Create Audit Logs Table
        CREATE TABLE IF NOT EXISTS silantas.audit_logs (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES silantas.users(id),
            username VARCHAR(64) NOT NULL,
            user_role VARCHAR(64) NOT NULL,
            action VARCHAR(50) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(100),
            description TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Create Settings Table
        CREATE TABLE IF NOT EXISTS silantas.settings (
            key VARCHAR(100) PRIMARY KEY,
            value TEXT NOT NULL,
            description TEXT,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- Seed Default Settings
        INSERT INTO silantas.settings (key, value, description)
        VALUES 
            ('whatsapp_number', '6281240000000', 'Nomor WhatsApp Business Pelayanan Dinas'),
            ('whatsapp_message', 'Halo Admin SUANGGI (Sistem Informasi Lalu Lintas Hewan) Kabupaten Mimika, saya ingin konsultasi mengenai persyaratan lalu lintas hewan/produk hewan.', 'Pesan template awal konsultasi'),
            ('agency_name', 'Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika', 'Nama Instansi')
        ON CONFLICT (key) DO NOTHING;

        -- Migrate legacy default WhatsApp message from SI-LANTAS to SUANGGI
        UPDATE silantas.settings
        SET value = 'Halo Admin SUANGGI (Sistem Informasi Lalu Lintas Hewan) Kabupaten Mimika, saya ingin konsultasi mengenai persyaratan lalu lintas hewan/produk hewan.',
            updated_at = NOW()
        WHERE key = 'whatsapp_message' AND value LIKE '%SI-LANTAS%';

        -- Seed Initial Accounts with Verified Argon2 Hashes
        -- admin: admin123
        -- drh_sarah, petugas_budi, pimpinan_yohanis: password123
        INSERT INTO silantas.users (id, full_name, username, email, password_hash, role, is_active, phone_number, agency)
        VALUES 
            ('e1000000-0000-0000-0000-000000000000', 'Administrator SUANGGI', 'admin', 'admin@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$wM4W0M5psB/tFJfgCRz1cA$fVchlIji3Rls/OKqYFC/G2GY2ox0hLPdVNfgXrcA+us', 'admin', true, '081248000000', 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika'),
            ('e1000000-0000-0000-0000-000000000001', 'drh. Sarah Wonda, M.Sc.', 'drh_sarah', 'sarah.wonda@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$OWl84TRrFqoiLQINkF8Xhg$PH0Wec9lY+Nu9+NnUeRXuYB9hi+O3MkSrFDsmxLXgrc', 'dokter_hewan', true, '081248001001', 'Bidang Kesehatan Hewan Kab. Mimika'),
            ('e1000000-0000-0000-0000-000000000002', 'Budi Santoso, S.Pt.', 'petugas_budi', 'budi.santoso@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$OWl84TRrFqoiLQINkF8Xhg$PH0Wec9lY+Nu9+NnUeRXuYB9hi+O3MkSrFDsmxLXgrc', 'petugas', true, '081248001002', 'Pos Pengawasan Lalu Lintas Pomako'),
            ('e1000000-0000-0000-0000-000000000003', 'Drs. Yohanis Maturbongs', 'pimpinan_yohanis', 'yohanis.maturbongs@mimikakab.go.id', '$argon2id$v=19$m=19456,t=2,p=1$OWl84TRrFqoiLQINkF8Xhg$PH0Wec9lY+Nu9+NnUeRXuYB9hi+O3MkSrFDsmxLXgrc', 'pimpinan', true, '081248001003', 'Kepala Dinas Peternakan & Keswan')
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
    "#;

    sqlx::raw_sql(init_sql)
        .execute(pool)
        .await?;

    tracing::info!("Database schema and tables initialized successfully.");
    Ok(())
}
