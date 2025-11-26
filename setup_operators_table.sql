-- Create Operators table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_operators_email ON public.operators(email);
CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);

-- Enable Row Level Security
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to read operators
CREATE POLICY "Allow public to read operators" ON public.operators
    FOR SELECT
    USING (true);

-- Allow authenticated users to insert operators
CREATE POLICY "Allow authenticated to insert operators" ON public.operators
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update operators
CREATE POLICY "Allow authenticated to update operators" ON public.operators
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete operators
CREATE POLICY "Allow authenticated to delete operators" ON public.operators
    FOR DELETE
    TO authenticated
    USING (true);

-- Insert sample data
INSERT INTO public.operators (name, email, role, status, last_access) VALUES
    ('Carlos Mendes', 'carlos@sol.com', 'Senior', 'active', '2024-03-14 10:30:00+00'),
    ('Ana Paula', 'ana@sol.com', 'Pleno', 'active', '2024-03-14 09:15:00+00'),
    ('Ricardo Lima', 'ricardo@sol.com', 'Junior', 'inactive', '2024-03-13 18:45:00+00')
ON CONFLICT (email) DO NOTHING;
