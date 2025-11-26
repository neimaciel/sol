-- Consolidated fixes for CardModal Event Logging

-- 1. Fix Drivers Table RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON drivers;
CREATE POLICY "Enable read access for all users" ON drivers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON drivers;
CREATE POLICY "Enable insert for authenticated users only" ON drivers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON drivers;
CREATE POLICY "Enable update for authenticated users only" ON drivers FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON drivers;
CREATE POLICY "Enable delete for authenticated users only" ON drivers FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Setup Audit Log (card_events)
CREATE TABLE IF NOT EXISTS public.card_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.card_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.card_events;
CREATE POLICY "Enable read access for all users" ON public.card_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.card_events;
CREATE POLICY "Enable insert for authenticated users" ON public.card_events FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- 3. Setup Candidates Table (load_candidates)
CREATE TABLE IF NOT EXISTS public.load_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    load_id TEXT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('interested', 'negotiating', 'accepted', 'rejected')) DEFAULT 'interested',
    bid_value DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.load_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.load_candidates;
CREATE POLICY "Enable read access for all users" ON public.load_candidates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.load_candidates;
CREATE POLICY "Enable insert for authenticated users" ON public.load_candidates FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.load_candidates;
CREATE POLICY "Enable update for authenticated users" ON public.load_candidates FOR UPDATE USING (auth.role() = 'anon' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.load_candidates;
CREATE POLICY "Enable delete for authenticated users" ON public.load_candidates FOR DELETE USING (auth.role() = 'anon' OR auth.role() = 'authenticated');
