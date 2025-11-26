-- =========================================
-- Database Fixes - S.O.L System
-- =========================================
-- This script creates missing tables and fixes database issues
-- Run this in Supabase SQL Editor

-- =========================================
-- 1. CREATE OPERATORS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Senior', 'Pleno', 'Junior')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_access TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for operators
CREATE INDEX IF NOT EXISTS idx_operators_email ON public.operators(email);
CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);

-- Enable Row Level Security for operators
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operators
DROP POLICY IF EXISTS "Allow public to read operators" ON public.operators;
CREATE POLICY "Allow public to read operators" ON public.operators
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert operators" ON public.operators;
CREATE POLICY "Allow authenticated to insert operators" ON public.operators
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to update operators" ON public.operators;
CREATE POLICY "Allow authenticated to update operators" ON public.operators
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to delete operators" ON public.operators;
CREATE POLICY "Allow authenticated to delete operators" ON public.operators
    FOR DELETE
    TO authenticated
    USING (true);

-- Insert sample operators
INSERT INTO public.operators (name, email, role, status, last_access) VALUES
    ('Carlos Mendes', 'carlos@sol.com', 'Senior', 'active', now()),
    ('Ana Paula', 'ana@sol.com', 'Pleno', 'active', now()),
    ('Ricardo Lima', 'ricardo@sol.com', 'Junior', 'inactive', now())
ON CONFLICT (email) DO NOTHING;

-- =========================================
-- 2. VERIFY/CREATE GROUPS TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'VUC', 'Toco', 'Truck', 'Carreta', etc.
    description TEXT,
    region TEXT, -- 'Nacional', 'SP', 'RJ', etc.
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add whatsapp_link column if it doesn't exist (for existing tables)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;

-- Create index for groups
CREATE INDEX IF NOT EXISTS idx_groups_type ON public.groups(type);
CREATE INDEX IF NOT EXISTS idx_groups_region ON public.groups(region);

-- Enable Row Level Security for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
DROP POLICY IF EXISTS "Allow public to read groups" ON public.groups;
CREATE POLICY "Allow public to read groups" ON public.groups
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage groups" ON public.groups;
CREATE POLICY "Allow authenticated to manage groups" ON public.groups
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert sample WhatsApp groups (matching existing constraint: Carreta, Truck, Vuc, Van)
INSERT INTO public.groups (name, type, description, region, whatsapp_link) VALUES
    ('Motoristas Carreta SP', 'Carreta', 'Grupo para motoristas de carreta em SP', 'SP', 'https://chat.whatsapp.com/example1'),
    ('Motoristas Vuc Nacional', 'Vuc', 'Grupo nacional de motoristas Vuc', 'Nacional', 'https://chat.whatsapp.com/example2'),
    ('Motoristas Truck RJ', 'Truck', 'Grupo de motoristas de truck no RJ', 'RJ', 'https://chat.whatsapp.com/example3'),
    ('Motoristas Van SP', 'Van', 'Grupo de motoristas de van em SP', 'SP', 'https://chat.whatsapp.com/example4')
ON CONFLICT DO NOTHING;

-- =========================================
-- 3. ADD CARD AUTOMATION FIELDS TO LOADS
-- =========================================
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.loads.arrival_time IS 'Timestamp when driver arrived at destination (triggers Transit → Unloading)';
COMMENT ON COLUMN public.loads.auto_advance IS 'Enable/disable automatic card progression for this load';

-- =========================================
-- 4. CREATE CONTRACT TEMPLATES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL, -- Template content with placeholders
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add category column if it doesn't exist (for existing tables)
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index for templates
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON public.contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON public.contract_templates(is_active);

-- Enable Row Level Security for templates
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
DROP POLICY IF EXISTS "Allow public to read templates" ON public.contract_templates;
CREATE POLICY "Allow public to read templates" ON public.contract_templates
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage templates" ON public.contract_templates;
CREATE POLICY "Allow authenticated to manage templates" ON public.contract_templates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert sample contract templates
INSERT INTO public.contract_templates (name, description, content, category) VALUES
    ('Contrato Padrão Carreta', 'Modelo de contrato padrão para transporte de carreta', 
     'CONTRATO DE TRANSPORTE\n\nMotorista: {{driver_name}}\nCPF: {{driver_cpf}}\nOrigem: {{origin}}\nDestino: {{destination}}\nValor: {{value}}\n\nAssinatura: __________________',
     'Carreta'),
    ('Contrato Padrão Vuc', 'Modelo de contrato para Vuc', 
     'CONTRATO DE TRANSPORTE VUC\n\nMotorista: {{driver_name}}\nOrigem: {{origin}}\nDestino: {{destination}}\n\nAssinatura: __________________',
     'Vuc')
ON CONFLICT DO NOTHING;

-- =========================================
-- VERIFICATION QUERIES
-- =========================================
-- Run these to verify everything was created successfully:

-- Check operators
-- SELECT count(*) as operators_count FROM public.operators;

-- Check groups
-- SELECT count(*) as groups_count FROM public.groups;

-- Check loads columns
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'loads' AND column_name IN ('arrival_time', 'auto_advance');

-- =========================================
-- 5. CREATE PRODUCT TEMPLATES TABLE
-- =========================================
CREATE TABLE IF NOT EXISTS public.product_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    product_type TEXT NOT NULL, -- 'Soja', 'Milho', 'Fertilizante', etc.
    requirements TEXT, -- JSON string or text description of requirements
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for product templates
CREATE INDEX IF NOT EXISTS idx_product_templates_type ON public.product_templates(product_type);

-- Enable Row Level Security for product templates
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product templates
DROP POLICY IF EXISTS "Allow public to read product templates" ON public.product_templates;
CREATE POLICY "Allow public to read product templates" ON public.product_templates
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage product templates" ON public.product_templates;
CREATE POLICY "Allow authenticated to manage product templates" ON public.product_templates
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert sample product templates
INSERT INTO public.product_templates (name, description, product_type, requirements) VALUES
    ('Soja Padrão Exportação', 'Requisitos para transporte de soja tipo exportação', 'Soja', 'Umidade máx 14%, Impurezas máx 1%'),
    ('Milho Grão', 'Transporte de milho a granel', 'Milho', 'Livre de insetos vivos, Sem odores estranhos'),
    ('Fertilizante Big Bag', 'Transporte de fertilizante em Big Bags', 'Fertilizante', 'Veículo limpo e seco, Lona impermeável obrigatória')
ON CONFLICT DO NOTHING;

-- Check product templates
-- SELECT count(*) as product_templates_count FROM public.product_templates;
