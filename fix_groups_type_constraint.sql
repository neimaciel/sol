-- Fix Groups Type Constraint
-- The frontend uses 'Frota Própria', 'Agregados', 'Terceiros'
-- The database was set up with 'Carreta', 'Truck', 'Vuc', 'Van'

ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_type_check;

ALTER TABLE public.groups ADD CONSTRAINT groups_type_check 
    CHECK (type IN ('Frota Própria', 'Agregados', 'Terceiros', 'Carreta', 'Truck', 'Vuc', 'Van'));
