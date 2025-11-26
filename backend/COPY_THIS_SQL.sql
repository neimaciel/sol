-- 🚀 COPIE E COLE ESTE SQL NO SUPABASE SQL EDITOR
-- Link direto: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/sql/new

-- 1. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_phone ON drivers(phone);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    plate TEXT,
    capacity TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(driver_id);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    state TEXT DEFAULT 'IDLE',
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(state);

-- 4. Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (usando DO block para evitar erro se já existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'drivers' 
        AND policyname = 'Service role can do everything on drivers'
    ) THEN
        CREATE POLICY "Service role can do everything on drivers"
            ON drivers FOR ALL
            USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicles' 
        AND policyname = 'Service role can do everything on vehicles'
    ) THEN
        CREATE POLICY "Service role can do everything on vehicles"
            ON vehicles FOR ALL
            USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'conversations' 
        AND policyname = 'Service role can do everything on conversations'
    ) THEN
        CREATE POLICY "Service role can do everything on conversations"
            ON conversations FOR ALL
            USING (true);
    END IF;
END $$;

-- 6. Grant permissions
GRANT ALL ON drivers TO service_role;
GRANT ALL ON vehicles TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE vehicles_id_seq TO service_role;

-- ✅ Success message
SELECT 'Migration completed successfully! 🎉' AS status;
