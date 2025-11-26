-- =========================================
-- PASSO 2: ADICIONAR WHATSAPP_LINK À TABELA GROUPS
-- Execute depois do passo 1
-- =========================================

-- Adicionar coluna whatsapp_link
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS whatsapp_link TEXT;

-- Atualizar dados de exemplo (opcional - só se quiser adicionar links de exemplo)
-- UPDATE public.groups SET whatsapp_link = 'https://chat.whatsapp.com/exemplo1' WHERE type = 'Carreta' AND whatsapp_link IS NULL LIMIT 1;
