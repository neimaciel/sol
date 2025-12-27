-- Migration 006: Sistema de Pagamentos
-- Criar tabelas de pagamento e métodos de pagamento

-- Tabela de métodos de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MANUAL', 'GATEWAY')),
    gateway_provider TEXT,
    is_active BOOLEAN DEFAULT true,
    requires_bank_data BOOLEAN DEFAULT false,
    supports_instant BOOLEAN DEFAULT false,
    processing_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    load_id TEXT NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    
    -- Valores
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'BRL',
    
    -- Status e Método
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_CONFIRMED')),
    payment_method TEXT DEFAULT 'MANUAL',
    
    -- Dados Bancários (para pagamento manual)
    bank_name TEXT,
    bank_agency TEXT,
    bank_account TEXT,
    bank_account_type TEXT CHECK (bank_account_type IN ('CHECKING', 'SAVINGS')),
    pix_key TEXT,
    pix_key_type TEXT CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM')),
    
    -- Gateway de Pagamento
    gateway_provider TEXT,
    gateway_payment_id TEXT,
    gateway_response TEXT,
    
    -- Confirmação Manual
    manual_confirmed_by TEXT,
    manual_confirmed_at TIMESTAMPTZ,
    manual_confirmation_notes TEXT,
    
    -- Comprovantes
    receipt_url TEXT,
    receipt_uploaded_at TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Adicionar campo payment_status na tabela loads
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'payment_status') THEN
        ALTER TABLE loads ADD COLUMN payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'));
    END IF;
END$$;

-- Adicionar dados bancários na tabela drivers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'bank_name') THEN
        ALTER TABLE drivers ADD COLUMN bank_name TEXT;
        ALTER TABLE drivers ADD COLUMN bank_agency TEXT;
        ALTER TABLE drivers ADD COLUMN bank_account TEXT;
        ALTER TABLE drivers ADD COLUMN bank_account_type TEXT CHECK (bank_account_type IN ('CHECKING', 'SAVINGS'));
        ALTER TABLE drivers ADD COLUMN pix_key TEXT;
        ALTER TABLE drivers ADD COLUMN pix_key_type TEXT CHECK (pix_key_type IN ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM'));
    END IF;
END$$;

-- Inserir métodos de pagamento padrão
INSERT INTO payment_methods (id, name, type, requires_bank_data, supports_instant, processing_time) VALUES
('manual-bank', 'Transferência Bancária Manual', 'MANUAL', true, false, '1-3 dias úteis'),
('manual-pix', 'PIX Manual', 'MANUAL', true, true, 'Instantâneo'),
('gateway-stripe', 'Cartão de Crédito (Stripe)', 'GATEWAY', false, true, 'Instantâneo'),
('gateway-mercadopago', 'Mercado Pago', 'GATEWAY', false, true, 'Instantâneo'),
('gateway-asaas', 'PIX/Boleto (Asaas)', 'GATEWAY', false, false, '1-2 dias úteis')
ON CONFLICT (id) DO NOTHING;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_payments_load_id ON payments(load_id);
CREATE INDEX IF NOT EXISTS idx_payments_driver_id ON payments(driver_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir tudo por enquanto - ajustar conforme autenticação)
CREATE POLICY "Allow all operations on payments" ON payments
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on payment_methods" ON payment_methods
    FOR ALL USING (true) WITH CHECK (true);