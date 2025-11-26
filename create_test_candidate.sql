-- Create a test candidate for verification
-- First, ensure we have a driver (using the first one found)
DO $$
DECLARE
    v_driver_id UUID;
    v_load_id TEXT := 'CARGA-4779'; -- Use an existing load ID or create one
BEGIN
    -- Get a driver ID
    SELECT id INTO v_driver_id FROM drivers LIMIT 1;
    
    -- If no driver, raise notice
    IF v_driver_id IS NULL THEN
        RAISE NOTICE 'No drivers found. Please create a driver first.';
        RETURN;
    END IF;

    -- Insert candidate if not exists
    INSERT INTO load_candidates (load_id, driver_id, status, bid_value)
    VALUES (v_load_id, v_driver_id, 'interested', 14500.00)
    ON CONFLICT (load_id, driver_id) 
    DO UPDATE SET status = 'interested';
    
    RAISE NOTICE 'Created candidate for driver % on load %', v_driver_id, v_load_id;
END $$;
