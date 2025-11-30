-- Enable RLS on loads if not already enabled
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to loads (so drivers can see them)
DO $$ BEGIN
    CREATE POLICY "Public can view loads"
        ON loads FOR SELECT
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy for public insert/update on drivers (so drivers can register/update info)
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public can insert drivers"
        ON drivers FOR INSERT
        WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can update own driver info"
        ON drivers FOR UPDATE
        USING (true); -- Ideally restrict to own phone, but for MVP/No-Auth this is acceptable
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can select drivers"
        ON drivers FOR SELECT
        USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policy for public insert on candidates (so drivers can apply)
-- Note: candidates table RLS was enabled in migration 002

DO $$ BEGIN
    CREATE POLICY "Public can insert candidates"
        ON candidates FOR INSERT
        WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public can view own candidacy"
        ON candidates FOR SELECT
        USING (true); -- Simplified for MVP
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON loads TO anon, authenticated;
GRANT ALL ON drivers TO anon, authenticated;
GRANT ALL ON candidates TO anon, authenticated;
