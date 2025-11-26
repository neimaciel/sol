-- =========================================
-- PASSO 4: CRIAR TABELA CONTRACT_TEMPLATES
-- Execute depois do passo 3
-- =========================================

CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar TODAS as colunas que podem não existir na tabela antiga
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.contract_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Tornar a coluna url nullable (a tabela antiga tem url NOT NULL, mas para templates de texto não precisamos)
ALTER TABLE public.contract_templates ALTER COLUMN url DROP NOT NULL;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON public.contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON public.contract_templates(is_active);

-- Habilitar RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Allow public to read templates" ON public.contract_templates;
CREATE POLICY "Allow public to read templates" ON public.contract_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage templates" ON public.contract_templates;
CREATE POLICY "Allow authenticated to manage templates" ON public.contract_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inserir exemplos
INSERT INTO public.contract_templates (name, description, content, category) VALUES
    ('Contrato Padrão Carreta', 'Modelo de contrato padrão para transporte de carreta', 
     'CONTRATO DE TRANSPORTE

Motorista: {{driver_name}}
CPF: {{driver_cpf}}
Origem: {{origin}}
Destino: {{destination}}
Valor: {{value}}

Assinatura: __________________',
     'Carreta'),
    ('Contrato Padrão Vuc', 'Modelo de contrato para Vuc', 
     'CONTRATO DE TRANSPORTE VUC

Motorista: {{driver_name}}
Origem: {{origin}}
Destino: {{destination}}

Assinatura: __________________',
     'Vuc')
ON CONFLICT DO NOTHING;
