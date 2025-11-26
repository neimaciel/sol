-- 🚨 FIX MIGRATION: Limpar tabelas antigas e recriar corretamente
-- Link direto: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/sql/new

-- 1. Drop tables in correct order (to avoid FK errors)
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- 2. Create Drivers Table (ID = WhatsApp remoteJid = TEXT)
CREATE TABLE drivers (
    id TEXT PRIMARY KEY, -- WhatsApp ID (ex: 5511999999999@s.whatsapp.net)
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_phone ON drivers(phone);

-- 3. Create Vehicles Table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    plate TEXT,
    capacity TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);

-- 4. Create Conversations Table
CREATE TABLE conversations (
    id TEXT PRIMARY KEY, -- WhatsApp ID
    state TEXT DEFAULT 'IDLE',
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_state ON conversations(state);

-- 5. Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 6. Create policies
CREATE POLICY "Service role can do everything on drivers"
    ON drivers FOR ALL
    USING (true);

CREATE POLICY "Service role can do everything on vehicles"
    ON vehicles FOR ALL
    USING (true);

CREATE POLICY "Service role can do everything on conversations"
    ON conversations FOR ALL
    USING (true);

-- 7. Grant permissions
GRANT ALL ON drivers TO service_role;
GRANT ALL ON vehicles TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE vehicles_id_seq TO service_role;

SELECT 'Fix completed successfully! Tables recreated.' AS status;
