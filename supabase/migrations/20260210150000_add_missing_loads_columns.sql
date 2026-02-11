-- =============================================
-- ADD MISSING COLUMNS TO LOADS TABLE
-- =============================================
-- Bug ID: P13
-- Problema: Edge Function auto-advance referencia colunas que não existem
-- Solução: Adicionar todas as colunas necessárias para workflow completo

-- =============================================
-- 1. WORKFLOW TRACKING COLUMNS
-- =============================================

-- Timestamps para rastreamento do fluxo
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trip_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

COMMENT ON COLUMN loads.contract_signed_at IS 'Data/hora que o contrato foi assinado';
COMMENT ON COLUMN loads.trip_started_at IS 'Data/hora que a viagem iniciou (saiu para coleta)';
COMMENT ON COLUMN loads.delivered_at IS 'Data/hora que a carga foi entregue';
COMMENT ON COLUMN loads.payment_confirmed_at IS 'Data/hora que o pagamento foi confirmado';

-- =============================================
-- 2. DOCUMENT URLs
-- =============================================

-- URLs de documentos necessários
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS cnh_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS insurance_url TEXT;

COMMENT ON COLUMN loads.cnh_url IS 'URL da CNH do motorista (upload Supabase Storage)';
COMMENT ON COLUMN loads.vehicle_doc_url IS 'URL do documento do veículo (CRLV)';
COMMENT ON COLUMN loads.insurance_url IS 'URL da apólice de seguro';

-- =============================================
-- 3. RISK ANALYSIS FIELDS
-- =============================================

-- Dados de análise de risco
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  ADD COLUMN IF NOT EXISTS risk_factors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_notes TEXT;

COMMENT ON COLUMN loads.risk_score IS 'Score de risco de 0-100 (calculado automaticamente)';
COMMENT ON COLUMN loads.risk_factors IS 'Array de fatores de risco detectados';
COMMENT ON COLUMN loads.risk_notes IS 'Notas do analista de risco';

-- =============================================
-- 4. PAYMENT TRACKING
-- =============================================

-- Informações de pagamento
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES operators(id);

COMMENT ON COLUMN loads.payment_method IS 'Método de pagamento: pix, transferencia, dinheiro, etc';
COMMENT ON COLUMN loads.payment_receipt_url IS 'URL do comprovante de pagamento';
COMMENT ON COLUMN loads.payment_confirmed_by IS 'Operador que confirmou o pagamento';

-- =============================================
-- 5. TRACKING & LOCATION
-- =============================================

-- Dados de rastreamento
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS current_location JSONB,
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_delivery TIMESTAMPTZ;

COMMENT ON COLUMN loads.current_location IS 'Localização atual (GPS): {lat, lng, address, timestamp}';
COMMENT ON COLUMN loads.estimated_delivery IS 'Previsão de entrega (calculada)';
COMMENT ON COLUMN loads.actual_delivery IS 'Entrega real (confirmada)';

-- =============================================
-- 6. ADDITIONAL METADATA
-- =============================================

-- Metadados adicionais
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS distance_km NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS duration_hours NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS toll_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS fuel_cost NUMERIC(10,2);

COMMENT ON COLUMN loads.distance_km IS 'Distância total em km (calculada ou informada)';
COMMENT ON COLUMN loads.duration_hours IS 'Duração estimada em horas';
COMMENT ON COLUMN loads.toll_cost IS 'Custo de pedágios';
COMMENT ON COLUMN loads.fuel_cost IS 'Custo estimado de combustível';

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

-- Índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_loads_contract_signed ON loads(contract_signed_at) WHERE contract_signed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_trip_started ON loads(trip_started_at) WHERE trip_started_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_delivered ON loads(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_payment_confirmed ON loads(payment_confirmed_at) WHERE payment_confirmed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_risk_score ON loads(risk_score) WHERE risk_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loads_estimated_delivery ON loads(estimated_delivery) WHERE estimated_delivery IS NOT NULL;

-- =============================================
-- 8. VALIDATION FUNCTIONS
-- =============================================

-- Função: Validar se carga pode avançar no workflow
CREATE OR REPLACE FUNCTION public.can_advance_load(
  load_id UUID,
  target_column VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  load_record RECORD;
BEGIN
  SELECT * INTO load_record FROM loads WHERE id = load_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Validações por coluna de destino
  CASE target_column
    WHEN 'contract' THEN
      -- Precisa ter motorista e documentos verificados
      RETURN load_record.driver_id IS NOT NULL
        AND load_record.documents_status = 'verified';

    WHEN 'loading' THEN
      -- Precisa ter contrato assinado
      RETURN load_record.contract_signed_at IS NOT NULL;

    WHEN 'transit' THEN
      -- Precisa ter iniciado viagem
      RETURN load_record.trip_started_at IS NOT NULL;

    WHEN 'unloading' THEN
      -- Precisa ter chegado ao destino
      RETURN load_record.arrival_time IS NOT NULL;

    WHEN 'completed' THEN
      -- Precisa ter POD e entrega confirmada
      RETURN load_record.pod_url IS NOT NULL
        AND load_record.delivered_at IS NOT NULL;

    ELSE
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.can_advance_load IS 'Valida se uma carga pode avançar para determinada coluna do workflow';

-- =============================================
-- 9. TRIGGER PARA AUTO-TIMESTAMPS
-- =============================================

-- Trigger para popular timestamps automaticamente
CREATE OR REPLACE FUNCTION public.loads_auto_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Se mudou para 'contract' e não tem contract_signed_at, popular
  IF NEW.column_id = 'contract' AND OLD.column_id != 'contract' AND NEW.contract_signed_at IS NULL THEN
    NEW.contract_signed_at = NOW();
  END IF;

  -- Se mudou para 'transit' e não tem trip_started_at, popular
  IF NEW.column_id = 'transit' AND OLD.column_id != 'transit' AND NEW.trip_started_at IS NULL THEN
    NEW.trip_started_at = NOW();
  END IF;

  -- Se mudou para 'completed' e não tem delivered_at, popular
  IF NEW.column_id = 'completed' AND OLD.column_id != 'completed' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS loads_auto_timestamp_trigger ON loads;
CREATE TRIGGER loads_auto_timestamp_trigger
  BEFORE UPDATE ON loads
  FOR EACH ROW
  EXECUTE FUNCTION public.loads_auto_timestamp();

-- =============================================
-- 10. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Colunas adicionadas à tabela loads com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Colunas adicionadas:';
    RAISE NOTICE '   Workflow: contract_signed_at, trip_started_at, delivered_at, payment_confirmed_at';
    RAISE NOTICE '   Documents: cnh_url, vehicle_doc_url, insurance_url';
    RAISE NOTICE '   Risk: risk_score, risk_factors, risk_notes';
    RAISE NOTICE '   Payment: payment_method, payment_receipt_url, payment_confirmed_by';
    RAISE NOTICE '   Tracking: current_location, estimated_delivery, actual_delivery';
    RAISE NOTICE '   Costs: distance_km, duration_hours, toll_cost, fuel_cost';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Funções criadas:';
    RAISE NOTICE '   - can_advance_load(load_id, target_column): Valida transições';
    RAISE NOTICE '   - loads_auto_timestamp(): Popula timestamps automaticamente';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Índices criados para melhor performance';
    RAISE NOTICE '';
END $$;
