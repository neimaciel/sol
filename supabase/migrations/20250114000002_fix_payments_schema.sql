-- ============================================
-- FIX PAYMENTS TABLE SCHEMA
-- Add missing columns used by Edge Function
-- ============================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS manual_confirmed_by UUID REFERENCES operators(id),
  ADD COLUMN IF NOT EXISTS manual_confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS manual_confirmation_notes TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_data JSONB;

COMMENT ON COLUMN payments.manual_confirmed_by IS 'Operator who manually confirmed the payment';
COMMENT ON COLUMN payments.manual_confirmed_at IS 'Timestamp of manual confirmation';
COMMENT ON COLUMN payments.manual_confirmation_notes IS 'Notes added during manual confirmation';
COMMENT ON COLUMN payments.receipt_url IS 'URL to payment receipt document';
COMMENT ON COLUMN payments.bank_data IS 'Bank account information for payment';
