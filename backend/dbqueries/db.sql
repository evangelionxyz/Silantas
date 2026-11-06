-- Schema definition for SILANTAS HEWAN MIMIKA
CREATE SCHEMA IF NOT EXISTS silantas;

-- Users table
CREATE TABLE IF NOT EXISTS silantas.users (
	id UUID PRIMARY KEY,
	full_name VARCHAR(255) NOT NULL,
	username VARCHAR(64) UNIQUE NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	role VARCHAR(64) NOT NULL DEFAULT 'petugas', -- 'admin', 'petugas', 'dokter_hewan', 'pimpinan'
	is_active BOOLEAN NOT NULL DEFAULT true,
	phone_number VARCHAR(50),
	agency VARCHAR(255) DEFAULT 'Dinas Peternakan dan Kesehatan Hewan Kab. Mimika',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON silantas.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON silantas.users(username);

-- Traffic records table (Import / Export)
CREATE TABLE IF NOT EXISTS silantas.traffic_records (
	id UUID PRIMARY KEY,
	record_number VARCHAR(100) NOT NULL,
	traffic_type VARCHAR(20) NOT NULL, -- 'IMPORT', 'EXPORT'
	category VARCHAR(50) NOT NULL, -- 'HEWAN_HIDUP', 'PRODUK_HEWAN', 'OLAHAN_PRODUK_HEWAN'
	item_name VARCHAR(255) NOT NULL,
	quantity NUMERIC(12, 2) NOT NULL,
	unit VARCHAR(50) NOT NULL, -- 'kg', 'ekor', 'rak', 'ton', 'karton', etc. (customizable)
	origin VARCHAR(255) NOT NULL,
	destination VARCHAR(255) NOT NULL,
	transport_type VARCHAR(50) NOT NULL, -- 'UDARA', 'LAUT', 'DARAT'
	applicant_name VARCHAR(255) NOT NULL,
	health_certificate_no VARCHAR(100),
	inspection_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'INSPECTED_PASS', 'INSPECTED_REJECT'
	notes TEXT,
	recorded_by UUID REFERENCES silantas.users(id),
	traffic_date DATE NOT NULL DEFAULT CURRENT_DATE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_date ON silantas.traffic_records(traffic_date);
CREATE INDEX IF NOT EXISTS idx_traffic_type ON silantas.traffic_records(traffic_type);
CREATE INDEX IF NOT EXISTS idx_traffic_category ON silantas.traffic_records(category);
CREATE INDEX IF NOT EXISTS idx_traffic_item_name ON silantas.traffic_records(item_name);

-- Audit logs table
CREATE TABLE IF NOT EXISTS silantas.audit_logs (
	id UUID PRIMARY KEY,
	user_id UUID REFERENCES silantas.users(id),
	username VARCHAR(64) NOT NULL,
	user_role VARCHAR(64) NOT NULL,
	action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
	entity_type VARCHAR(50) NOT NULL, -- 'TRAFFIC_RECORD', 'USER', 'SETTINGS', 'AUTH'
	entity_id VARCHAR(100),
	description TEXT NOT NULL,
	metadata JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON silantas.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON silantas.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON silantas.audit_logs(entity_type, entity_id);

-- System settings table
CREATE TABLE IF NOT EXISTS silantas.settings (
	key VARCHAR(100) PRIMARY KEY,
	value TEXT NOT NULL,
	description TEXT,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO silantas.settings (key, value, description)
VALUES 
	('whatsapp_number', '6281240000000', 'Nomor WhatsApp Business Pelayanan Dinas'),
	('whatsapp_message', 'Halo Admin SI-LANTAS HEWAN MIMIKA, saya ingin konsultasi mengenai persyaratan lalu lintas hewan/produk hewan.', 'Pesan template awal konsultasi'),
	('agency_name', 'Dinas Peternakan dan Kesehatan Hewan Kabupaten Mimika', 'Nama Instansi')
ON CONFLICT (key) DO NOTHING;
