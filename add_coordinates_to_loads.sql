-- Add coordinates to loads table for Haversine calculation
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS origin_lat float;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS origin_lon float;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS destination_lat float;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS destination_lon float;

-- Update existing rows with mock coordinates for testing (Sao Paulo / Rio)
UPDATE public.loads SET origin_lat = -23.5505, origin_lon = -46.6333 WHERE origin ILIKE '%SP%';
UPDATE public.loads SET origin_lat = -22.9068, origin_lon = -43.1729 WHERE origin ILIKE '%RJ%';
