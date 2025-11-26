-- Enable RLS on drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create policies for drivers
DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
CREATE POLICY "Enable read access for all users" ON drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON drivers;
CREATE POLICY "Enable insert for authenticated users only" ON drivers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON drivers;
CREATE POLICY "Enable update for authenticated users only" ON drivers FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON drivers;
CREATE POLICY "Enable delete for authenticated users only" ON drivers FOR DELETE USING (auth.role() = 'authenticated');

-- Insert test driver again
INSERT INTO drivers (
    name, 
    phone, 
    vehicle_type, 
    vehicle_plate, 
    status, 
    rating, 
    trips_count,
    avatar_url
) VALUES (
    'Roberto Santos', 
    '+5511999999999', 
    'Carreta LS', 
    'ABC-1234', 
    'available', 
    4.8, 
    150,
    'https://i.pravatar.cc/150?u=roberto'
) ON CONFLICT DO NOTHING;

-- Insert candidate for the specific load ID if known, or just ensure driver exists
-- We will use the UI to invite him since we don't know the random load ID
