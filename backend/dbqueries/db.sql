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
