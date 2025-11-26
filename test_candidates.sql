-- Test script to create candidate data for testing
-- Run this in Supabase SQL Editor

-- First, let's check if we have drivers
SELECT id, name, vehicle FROM drivers LIMIT 5;

-- If you have drivers, insert a test candidate for card CARGA-4779
-- Replace the driver_id with an actual driver ID from the first query
INSERT INTO load_candidates (load_id, driver_id, status, bid_value)
VALUES ('CARGA-4779', 'YOUR_DRIVER_ID_HERE', 'interested', 15000.00);

-- Check the candidates
SELECT 
    lc.*,
    d.name as driver_name,
    d.vehicle as driver_vehicle
FROM load_candidates lc
JOIN drivers d ON d.id = lc.driver_id
WHERE lc.load_id = 'CARGA-4779';
