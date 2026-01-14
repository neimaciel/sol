-- ============================================
-- KANBAN COMPLETE SCHEMA MIGRATION
-- Adds all missing columns and tables for Kanban functionality
-- ============================================

-- ============================================
-- 1. ADD MISSING COLUMNS TO LOADS TABLE
-- ============================================

ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS column_id VARCHAR(50) DEFAULT 'registration',
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS origin VARCHAR(255),
  ADD COLUMN IF NOT EXISTS destination VARCHAR(255),
  ADD COLUMN IF NOT EXISTS value NUMERIC,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS risk_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS documents_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contract_url TEXT,
  ADD COLUMN IF NOT EXISTS checkin_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS pod_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS whatsapp_group_id UUID,
  ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN loads.column_id IS 'Kanban column ID (registration, broadcast, initial_service, etc.)';
COMMENT ON COLUMN loads.title IS 'Load title/description';
COMMENT ON COLUMN loads.origin IS 'Origin city/location (simplified)';
COMMENT ON COLUMN loads.destination IS 'Destination city/location (simplified)';
COMMENT ON COLUMN loads.value IS 'Load value/price';
COMMENT ON COLUMN loads.priority IS 'Load priority (normal, high, urgent)';
COMMENT ON COLUMN loads.risk_status IS 'Risk assessment status';
COMMENT ON COLUMN loads.documents_status IS 'Documentation status';
COMMENT ON COLUMN loads.contract_url IS 'URL to contract document';
COMMENT ON COLUMN loads.checkin_time IS 'Check-in timestamp';
COMMENT ON COLUMN loads.pod_url IS 'Proof of delivery URL';
COMMENT ON COLUMN loads.invoice_status IS 'Invoice status';
COMMENT ON COLUMN loads.whatsapp_group_id IS 'Associated WhatsApp group ID';
COMMENT ON COLUMN loads.arrival_time IS 'Arrival timestamp';
COMMENT ON COLUMN loads.auto_advance IS 'Auto-advance to next column when conditions met';

-- ============================================
-- 2. CREATE LOAD_MODELS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS load_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  origin VARCHAR(255),
  destination VARCHAR(255),
  type VARCHAR(100),
  vehicle_type VARCHAR(100),
  cargo_type VARCHAR(100),
  estimated_value NUMERIC,
  estimated_weight NUMERIC,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE load_models IS 'Load templates for quick creation';

-- ============================================
-- 3. CREATE CARD_EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS card_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES operators(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_events_card_id ON card_events(card_id);
CREATE INDEX IF NOT EXISTS idx_card_events_created_at ON card_events(created_at DESC);

COMMENT ON TABLE card_events IS 'Audit trail for card/load events';

-- ============================================
-- 4. CREATE CONTRACT_TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100),
  variables JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE contract_templates IS 'Contract templates for load agreements';

-- ============================================
-- 5. CREATE CANDIDATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  proposed_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(load_id, driver_id)
);

CREATE INDEX IF NOT EXISTS idx_candidates_load_id ON candidates(load_id);
CREATE INDEX IF NOT EXISTS idx_candidates_driver_id ON candidates(driver_id);

COMMENT ON TABLE candidates IS 'Driver candidates for loads';

-- ============================================
-- 6. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE load_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CREATE RLS POLICIES FOR NEW TABLES
-- ============================================

-- Load Models Policies
CREATE POLICY "Allow authenticated users to select load_models"
ON load_models FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert load_models"
ON load_models FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update load_models"
ON load_models FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete load_models"
ON load_models FOR DELETE
TO authenticated
USING (true);

-- Card Events Policies
CREATE POLICY "Allow authenticated users to select card_events"
ON card_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert card_events"
ON card_events FOR INSERT
TO authenticated
WITH CHECK (true);

-- Contract Templates Policies
CREATE POLICY "Allow authenticated users to select contract_templates"
ON contract_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert contract_templates"
ON contract_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update contract_templates"
ON contract_templates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete contract_templates"
ON contract_templates FOR DELETE
TO authenticated
USING (true);

-- Candidates Policies
CREATE POLICY "Allow authenticated users to select candidates"
ON candidates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert candidates"
ON candidates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update candidates"
ON candidates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete candidates"
ON candidates FOR DELETE
TO authenticated
USING (true);
