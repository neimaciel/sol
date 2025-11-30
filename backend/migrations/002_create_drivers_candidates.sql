-- Alter drivers table to add new columns
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_id TEXT NOT NULL, -- Matches loads.id type (TEXT)
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE, -- Matches drivers.id type (TEXT)
    status TEXT DEFAULT 'pending', -- pending, negotiating, selected, rejected
    chat_messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(load_id, driver_id) -- A driver can only apply once per load
);

-- Indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_load ON candidates(load_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- Enable RLS for candidates
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for candidates
DO $$ BEGIN
    CREATE POLICY "Service role can do everything on candidates"
        ON candidates FOR ALL
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT ALL ON candidates TO service_role;
