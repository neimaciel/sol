-- Card Automation Setup
-- Adds fields to support automatic card progression

-- Add arrival_time field (for Transit → Unloading transition)
ALTER TABLE loads ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP;

-- Add auto_advance flag (allows disabling automation per card)
ALTER TABLE loads ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN loads.arrival_time IS 'Timestamp when driver arrived at destination (triggers Transit → Unloading)';
COMMENT ON COLUMN loads.auto_advance IS 'Enable/disable automatic card progression for this load';
