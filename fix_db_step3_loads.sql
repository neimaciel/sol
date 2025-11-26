-- =========================================
-- PASSO 3: ADICIONAR CAMPOS DE AUTOMAÇÃO À TABELA LOADS
-- Execute depois do passo 2
-- =========================================

-- Adicionar campos para automação de cards
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP;
ALTER TABLE public.loads ADD COLUMN IF NOT EXISTS auto_advance BOOLEAN DEFAULT TRUE;

-- Adicionar comentários
COMMENT ON COLUMN public.loads.arrival_time IS 'Timestamp when driver arrived at destination (triggers Transit → Unloading)';
COMMENT ON COLUMN public.loads.auto_advance IS 'Enable/disable automatic card progression for this load';
