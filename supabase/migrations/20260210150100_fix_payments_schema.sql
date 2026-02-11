-- =============================================
-- FIX PAYMENTS TABLE SCHEMA
-- =============================================
-- Bug ID: P15
-- Problema: Tabela payments está incompleta
-- Solução: Adicionar colunas faltantes e melhorar estrutura

-- =============================================
-- 1. ADD MISSING COLUMNS
-- =============================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS manual_confirmed_by UUID REFERENCES operators(id),
  ADD COLUMN IF NOT EXISTS manual_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_data JSONB;

COMMENT ON COLUMN payments.manual_confirmed_by IS 'Operador que confirmou manualmente o pagamento';
COMMENT ON COLUMN payments.manual_confirmed_at IS 'Data/hora da confirmação manual';
COMMENT ON COLUMN payments.receipt_url IS 'URL do comprovante de pagamento (Supabase Storage)';
COMMENT ON COLUMN payments.bank_data IS 'Dados bancários: {bank, agency, account, pix_key}';

-- =============================================
-- 2. ADD PAYMENT METADATA
-- =============================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

COMMENT ON COLUMN payments.payment_method IS 'Método: pix, transferencia, boleto, dinheiro, cartao';
COMMENT ON COLUMN payments.payment_date IS 'Data efetiva do pagamento (pode diferir de created_at)';
COMMENT ON COLUMN payments.notes IS 'Observações sobre o pagamento';
COMMENT ON COLUMN payments.tags IS 'Tags para categorização: [urgente, parcelado, adiantamento]';

-- =============================================
-- 3. ADD INSTALLMENTS SUPPORT
-- =============================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS is_installment BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS installment_number INTEGER,
  ADD COLUMN IF NOT EXISTS total_installments INTEGER,
  ADD COLUMN IF NOT EXISTS parent_payment_id UUID REFERENCES payments(id);

COMMENT ON COLUMN payments.is_installment IS 'Se TRUE, este é um pagamento parcelado';
COMMENT ON COLUMN payments.installment_number IS 'Número da parcela (1, 2, 3...)';
COMMENT ON COLUMN payments.total_installments IS 'Total de parcelas';
COMMENT ON COLUMN payments.parent_payment_id IS 'ID do pagamento pai (se for parcela)';

-- =============================================
-- 4. ADD PAYMENT TRACKING
-- =============================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS overdue_days INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN status = 'paid' THEN 0
      WHEN due_date IS NULL THEN 0
      WHEN CURRENT_DATE > due_date THEN EXTRACT(DAY FROM CURRENT_DATE - due_date)::INTEGER
      ELSE 0
    END
  ) STORED;

COMMENT ON COLUMN payments.due_date IS 'Data de vencimento';
COMMENT ON COLUMN payments.paid_date IS 'Data efetiva do pagamento';
COMMENT ON COLUMN payments.overdue_days IS 'Dias de atraso (calculado automaticamente)';

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_payments_load_id ON payments(load_id);
CREATE INDEX IF NOT EXISTS idx_payments_driver_id ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_paid_date ON payments(paid_date) WHERE paid_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_parent ON payments(parent_payment_id) WHERE parent_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method) WHERE payment_method IS NOT NULL;

-- =============================================
-- 6. VALIDATION CONSTRAINTS
-- =============================================

-- Garantir que parcelas sejam consistentes
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS check_installment_consistency;

ALTER TABLE payments
  ADD CONSTRAINT check_installment_consistency CHECK (
    (is_installment = FALSE)
    OR
    (is_installment = TRUE AND installment_number > 0 AND total_installments > 0 AND installment_number <= total_installments)
  );

-- Garantir que valor seja positivo
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS check_positive_amount;

ALTER TABLE payments
  ADD CONSTRAINT check_positive_amount CHECK (amount > 0);

-- =============================================
-- 7. HELPER FUNCTIONS
-- =============================================

-- Função: Calcular total pago de uma carga
CREATE OR REPLACE FUNCTION public.get_total_paid_by_load(p_load_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE load_id = p_load_id
    AND status = 'paid';
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.get_total_paid_by_load IS 'Retorna o total já pago de uma carga';

-- Função: Calcular total pendente de uma carga
CREATE OR REPLACE FUNCTION public.get_total_pending_by_load(p_load_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE load_id = p_load_id
    AND status = 'pending';
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.get_total_pending_by_load IS 'Retorna o total pendente de pagamento de uma carga';

-- Função: Marcar pagamento como pago
CREATE OR REPLACE FUNCTION public.mark_payment_as_paid(
  p_payment_id UUID,
  p_operator_id UUID,
  p_receipt_url TEXT DEFAULT NULL,
  p_payment_date TIMESTAMPTZ DEFAULT NOW()
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments
  SET
    status = 'paid',
    paid_date = p_payment_date::DATE,
    manual_confirmed_by = p_operator_id,
    manual_confirmed_at = NOW(),
    receipt_url = COALESCE(p_receipt_url, receipt_url),
    updated_at = NOW()
  WHERE id = p_payment_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.mark_payment_as_paid IS 'Marca um pagamento como pago e registra quem confirmou';

-- =============================================
-- 8. AUTO-UPDATE LOAD PAYMENT STATUS
-- =============================================

-- Trigger para atualizar status de pagamento da carga
CREATE OR REPLACE FUNCTION public.update_load_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC;
  total_pending NUMERIC;
  load_price NUMERIC;
BEGIN
  -- Buscar valor total da carga
  SELECT price INTO load_price
  FROM loads
  WHERE id = NEW.load_id;

  -- Calcular totais
  total_paid := get_total_paid_by_load(NEW.load_id);
  total_pending := get_total_pending_by_load(NEW.load_id);

  -- Atualizar timestamp de confirmação de pagamento na carga
  IF total_paid >= load_price AND total_pending = 0 THEN
    UPDATE loads
    SET payment_confirmed_at = NOW()
    WHERE id = NEW.load_id AND payment_confirmed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_load_payment_status_trigger ON payments;
CREATE TRIGGER update_load_payment_status_trigger
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_load_payment_status();

-- =============================================
-- 9. RLS POLICIES (if not already set)
-- =============================================

-- Habilitar RLS se ainda não estiver
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "operators_can_manage_payments" ON payments;

-- Política: Operadores veem pagamentos de suas próprias cargas
CREATE POLICY "operators_can_view_own_load_payments"
ON payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = payments.load_id
    AND (loads.operator_id = auth.user_id() OR is_admin())
  )
);

-- Política: Operadores podem criar pagamentos para suas cargas
CREATE POLICY "operators_can_create_payments_for_own_loads"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = payments.load_id
    AND (loads.operator_id = auth.user_id() OR is_admin())
  )
);

-- Política: Operadores podem atualizar pagamentos de suas cargas
CREATE POLICY "operators_can_update_own_load_payments"
ON payments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = payments.load_id
    AND (loads.operator_id = auth.user_id() OR is_admin())
  )
);

-- Política: Apenas admins podem deletar
CREATE POLICY "only_admins_can_delete_payments"
ON payments FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- 10. SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schema da tabela payments corrigido!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Colunas adicionadas:';
    RAISE NOTICE '   - manual_confirmed_by, manual_confirmed_at';
    RAISE NOTICE '   - receipt_url, bank_data';
    RAISE NOTICE '   - payment_method, payment_date, notes, tags';
    RAISE NOTICE '   - is_installment, installment_number, total_installments, parent_payment_id';
    RAISE NOTICE '   - due_date, paid_date, overdue_days (calculado)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Funções criadas:';
    RAISE NOTICE '   - get_total_paid_by_load(load_id)';
    RAISE NOTICE '   - get_total_pending_by_load(load_id)';
    RAISE NOTICE '   - mark_payment_as_paid(payment_id, operator_id, receipt_url, date)';
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Triggers:';
    RAISE NOTICE '   - Auto-atualizar payment_confirmed_at na carga quando totalmente pago';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS Policies atualizadas';
    RAISE NOTICE '';
END $$;
