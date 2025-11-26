-- Create card_events table for audit logging
CREATE TABLE IF NOT EXISTS public.card_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- e.g., 'created', 'moved', 'updated', 'commented'
    details JSONB, -- Store flexible details about the event (e.g., { from: 'A', to: 'B' })
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.card_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.card_events
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.card_events
    FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');

-- Add comments
COMMENT ON TABLE public.card_events IS 'Audit log for all actions performed on a card (load)';
COMMENT ON COLUMN public.card_events.action IS 'Type of action performed (created, moved, updated, etc.)';
COMMENT ON COLUMN public.card_events.details IS 'JSON object containing specific details about the action';
