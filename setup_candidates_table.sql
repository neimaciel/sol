-- Create load_candidates table
CREATE TABLE IF NOT EXISTS public.load_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    load_id TEXT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('interested', 'negotiating', 'accepted', 'rejected')) DEFAULT 'interested',
    bid_value DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.load_candidates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.load_candidates
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.load_candidates
    FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.load_candidates
    FOR UPDATE USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.load_candidates
    FOR DELETE USING (auth.role() = 'anon' OR auth.role() = 'authenticated');
