-- Add new columns to loads table for Phase 5 functionalities

ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS broadcast_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS risk_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS documents_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS contract_url text,
ADD COLUMN IF NOT EXISTS checkin_time timestamptz,
ADD COLUMN IF NOT EXISTS pod_url text,
ADD COLUMN IF NOT EXISTS invoice_status text DEFAULT 'pending';

-- Add comments for clarity
COMMENT ON COLUMN loads.broadcast_status IS 'Status of load broadcast to drivers (pending, sent)';
COMMENT ON COLUMN loads.risk_status IS 'Risk analysis status (pending, approved, rejected)';
COMMENT ON COLUMN loads.documents_status IS 'Documentation validation status (pending, verified)';
COMMENT ON COLUMN loads.contract_url IS 'URL to the generated PDF contract';
COMMENT ON COLUMN loads.checkin_time IS 'Timestamp when the driver checked in for loading';
COMMENT ON COLUMN loads.pod_url IS 'URL to the Proof of Delivery (POD) document';
COMMENT ON COLUMN loads.invoice_status IS 'Payment/Invoice status (pending, paid)';
