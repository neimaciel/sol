-- Migration: Create tables for AI Freight Matching System
-- Run this in your Supabase SQL Editor

-- 1. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,  -- WhatsApp ID (remoteJid)
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_phone ON drivers(phone);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,  -- Truck, Van, Car, etc.
    plate TEXT,
    capacity TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);

-- 3. Conversations Table (Session Management)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,  -- WhatsApp ID (remoteJid)
    state TEXT DEFAULT 'IDLE',
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_state ON conversations(state);

-- 4. Update Loads Table (if coordinates don't exist)
-- Check if your loads table already has these columns
-- If not, uncomment and run:

-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_lat FLOAT;
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS origin_lon FLOAT;
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_lat FLOAT;
-- ALTER TABLE loads ADD COLUMN IF NOT EXISTS destination_lon FLOAT;

-- CREATE INDEX IF NOT EXISTS idx_loads_origin_coords ON loads(origin_lat, origin_lon);
-- CREATE INDEX IF NOT EXISTS idx_loads_status ON loads(status);

-- 5. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for service role access (backend can access all)
CREATE POLICY "Service role can do everything on drivers"
    ON drivers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on vehicles"
    ON vehicles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on conversations"
    ON conversations FOR ALL
    USING (auth.role() = 'service_role');

-- 7. Grant permissions
GRANT ALL ON drivers TO service_role;
GRANT ALL ON vehicles TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE vehicles_id_seq TO service_role;

-- Success!
SELECT 'Migration completed successfully!' AS status;
