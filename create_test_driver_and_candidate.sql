-- Create a test driver and candidate for verification
DO $$
DECLARE
    v_driver_id UUID;
    v_load_id TEXT := 'CARGA-4779'; -- Use an existing load ID
BEGIN
    -- Check if a driver exists, if not create one
    SELECT id INTO v_driver_id FROM drivers LIMIT 1;
    
    IF v_driver_id IS NULL THEN
        INSERT INTO drivers (
            name, 
            phone, 
            vehicle_type, 
            vehicle_plate, 
            status, 
            rating, 
            trips_count
        ) VALUES (
            'Roberto Santos', 
            '+5511999999999', 
            'Carreta LS', 
            'ABC-1234', 
            'available', 
            4.8, 
            150
        ) RETURNING id INTO v_driver_id;
        
        RAISE NOTICE 'Created new driver with ID %', v_driver_id;
    ELSE
        RAISE NOTICE 'Using existing driver with ID %', v_driver_id;
    END IF;

    -- Insert candidate if not exists
    INSERT INTO load_candidates (load_id, driver_id, status, bid_value)
    VALUES (v_load_id, v_driver_id, 'interested', 14500.00)
    ON CONFLICT (load_id, driver_id) 
    DO UPDATE SET status = 'interested';
    
    RAISE NOTICE 'Created candidate for driver % on load %', v_driver_id, v_load_id;
END $$;
