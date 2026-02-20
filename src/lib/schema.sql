-- ============================================
-- Dr.Ease Customer Onboarding Tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Onboarding Sessions
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token           UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    pin             VARCHAR(6) NOT NULL,
    pin_attempts    INT DEFAULT 0,
    pin_locked_at   TIMESTAMPTZ,
    customer_name   TEXT NOT NULL,
    status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','in_progress','submitted','approved','rejected')),
    current_step    INT DEFAULT 1,
    sheet_id        TEXT,
    sheet_url       TEXT,
    customer_id     BIGINT,
    created_by      TEXT,
    approved_by     TEXT,
    clinic_data     JSONB DEFAULT '{}',
    branch_data     JSONB DEFAULT '[]',
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    submitted_at    TIMESTAMPTZ,
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_token ON onboarding_sessions(token);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_created_by ON onboarding_sessions(created_by);

-- Activity Log
CREATE TABLE IF NOT EXISTS onboarding_activity_log (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id      BIGINT REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
    action          TEXT NOT NULL,
    step            INT,
    actor           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_log_session ON onboarding_activity_log(session_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_onboarding_updated_at
    BEFORE UPDATE ON onboarding_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_updated_at();
