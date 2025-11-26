-- =========================================
-- PASSO 1: CRIAR TABELA OPERATORS
-- Execute este bloco primeiro
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

CREATE INDEX IF NOT EXISTS idx_operators_email ON public.operators(email);
CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);

ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public to read operators" ON public.operators;
CREATE POLICY "Allow public to read operators" ON public.operators FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated to insert operators" ON public.operators;
CREATE POLICY "Allow authenticated to insert operators" ON public.operators FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to update operators" ON public.operators;
CREATE POLICY "Allow authenticated to update operators" ON public.operators FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated to delete operators" ON public.operators;
CREATE POLICY "Allow authenticated to delete operators" ON public.operators FOR DELETE TO authenticated USING (true);

INSERT INTO public.operators (name, email, role, status, last_access) VALUES
    ('Carlos Mendes', 'carlos@sol.com', 'Senior', 'active', now()),
    ('Ana Paula', 'ana@sol.com', 'Pleno', 'active', now()),
    ('Ricardo Lima', 'ricardo@sol.com', 'Junior', 'inactive', now())
ON CONFLICT (email) DO NOTHING;
