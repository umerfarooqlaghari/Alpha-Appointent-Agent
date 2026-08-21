-- n8n compatibility rules: keep all existing names/types; add only nullable/defaulted columns; do not use positional INSERTs.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'tenant_user',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_hash TEXT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);

-- Tenant-owned availability rules. Existing n8n tables remain unchanged.
CREATE TABLE IF NOT EXISTS tenant_availability_settings (
    tenant_id TEXT PRIMARY KEY,
    time_zone TEXT NOT NULL DEFAULT 'UTC',
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30
);
CREATE TABLE IF NOT EXISTS tenant_working_hours (
    tenant_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    PRIMARY KEY (tenant_id, day_of_week)
);
CREATE TABLE IF NOT EXISTS tenant_holidays (
    holiday_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    holiday_date DATE NOT NULL,
    name TEXT NULL
);
CREATE INDEX IF NOT EXISTS idx_tenant_holidays_tenant_date ON tenant_holidays (tenant_id, holiday_date);

CREATE TABLE IF NOT EXISTS tenant_slot_exclusions (
    tenant_id TEXT NOT NULL,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (tenant_id, slot_start)
);

-- Create the initial superadmin through the API or insert a BCrypt hash here.
-- Never commit a plaintext password.