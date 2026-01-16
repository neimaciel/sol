-- ============================================
-- ADD AUTO-ADVANCE WORKFLOW COLUMNS TO LOADS
-- Support for auto-advance conditions
-- ============================================

-- Add workflow tracking columns if they don't exist
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS risk_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cnh_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS insurance_url TEXT,
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trip_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN loads.risk_status IS 'Risk analysis status: pending, approved, rejected';
COMMENT ON COLUMN loads.cnh_url IS 'URL to uploaded CNH document';
COMMENT ON COLUMN loads.vehicle_doc_url IS 'URL to uploaded vehicle document';
COMMENT ON COLUMN loads.insurance_url IS 'URL to uploaded insurance document';
COMMENT ON COLUMN loads.contract_signed_at IS 'Timestamp when contract was signed';
COMMENT ON COLUMN loads.trip_started_at IS 'Timestamp when trip started';
COMMENT ON COLUMN loads.delivered_at IS 'Timestamp when load was delivered';
COMMENT ON COLUMN loads.payment_confirmed_at IS 'Timestamp when payment was confirmed';

-- Add index for risk_status queries
CREATE INDEX IF NOT EXISTS idx_loads_risk_status ON loads(risk_status);
