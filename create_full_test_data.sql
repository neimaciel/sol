-- Create full test data
-- 1. Create Load
INSERT INTO loads (
    id, title, column_id, priority, origin, destination, value, date, status
) VALUES (
    'CARGA-4779', 
    'Carga de Eletrônicos', 
    'broadcast', 
    'high', 
    'Santos, SP', 
    'Rio de Janeiro, RJ', 
    'R$ 15.000,00', 
    '20/11/2025', 
    'open'
) ON CONFLICT (id) DO UPDATE SET column_id = 'broadcast';

-- 2. Create Driver (disable RLS to ensure insert works)
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
INSERT INTO drivers (
    name, phone, vehicle, status, rating, avatar_url
) VALUES (
    'Roberto Santos', 
    '+5511999999999', 
    'Carreta LS', 
    'available', 
    4.8, 
    'https://i.pravatar.cc/150?u=roberto'
) ON CONFLICT DO NOTHING;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- 3. Create Candidate
INSERT INTO load_candidates (load_id, driver_id, status, bid_value)
SELECT 'CARGA-4779', id, 'interested', 14500.00
FROM drivers
WHERE name = 'Roberto Santos'
LIMIT 1
ON CONFLICT (load_id, driver_id) DO UPDATE SET status = 'interested';
