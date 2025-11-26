-- Setup Feature Expansion: Contracts, Groups, and Templates
-- Updated to include missing tables

-- 0. Ensure base tables exist (groups, load_models)
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Carreta', 'Truck', 'Vuc', 'Van')),
    description TEXT,
    members_count INTEGER DEFAULT 0,
    region TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS load_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Fracionada', 'Refrigerada', 'Carga Geral', 'Granel')),
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('Van', 'Carreta', 'Truck', 'Bitrem')),
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    description TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for base tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_models ENABLE ROW LEVEL SECURITY;

-- Policies for groups
DROP POLICY IF EXISTS "Allow public read access for groups" ON groups;
CREATE POLICY "Allow public read access for groups" ON groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert for groups" ON groups;
CREATE POLICY "Allow authenticated insert for groups" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update for groups" ON groups;
CREATE POLICY "Allow authenticated update for groups" ON groups FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete for groups" ON groups;
CREATE POLICY "Allow authenticated delete for groups" ON groups FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for load_models
DROP POLICY IF EXISTS "Allow public read access for load_models" ON load_models;
CREATE POLICY "Allow public read access for load_models" ON load_models FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert for load_models" ON load_models;
CREATE POLICY "Allow authenticated insert for load_models" ON load_models FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update for load_models" ON load_models;
CREATE POLICY "Allow authenticated update for load_models" ON load_models FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete for load_models" ON load_models;
CREATE POLICY "Allow authenticated delete for load_models" ON load_models FOR DELETE USING (auth.role() = 'authenticated');

-- Insert initial mock data if empty
INSERT INTO groups (name, type, description, members_count, region)
SELECT 'Carretas SP-RJ', 'Carreta', 'Grupo para ofertas de cargas com carretas no eixo SP-RJ', 234, 'Sudeste'
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Carretas SP-RJ');

INSERT INTO groups (name, type, description, members_count, region)
SELECT 'Trucks Sul', 'Truck', 'Motoristas de truck da região sul', 156, 'Sul'
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name = 'Trucks Sul');

INSERT INTO groups (name, type, description, members_count, region)
SELECT 'VUCs Grande SP', 'Vuc', 'Distribuição urbana na Grande São Paulo', 89, 'São Paulo'
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE name = 'VUCs Grande SP');

INSERT INTO load_models (name, type, vehicle_type, origin, destination, description, usage_count)
SELECT 'MG → SP Fracionada', 'Fracionada', 'Van', 'Belo Horizonte, MG', 'São Paulo, SP', 'Modelo para cargas fracionadas de MG para SP', 5
WHERE NOT EXISTS (SELECT 1 FROM load_models WHERE name = 'MG → SP Fracionada');

INSERT INTO load_models (name, type, vehicle_type, origin, destination, description, usage_count)
SELECT 'PR → SC Refrigerada', 'Refrigerada', 'Carreta', 'Curitiba, PR', 'Florianópolis, SC', 'Modelo para cargas refrigeradas entre PR e SC', 8
WHERE NOT EXISTS (SELECT 1 FROM load_models WHERE name = 'PR → SC Refrigerada');

INSERT INTO load_models (name, type, vehicle_type, origin, destination, description, usage_count)
SELECT 'SP → RJ Carga Geral', 'Carga Geral', 'Truck', 'São Paulo, SP', 'Rio de Janeiro, RJ', 'Modelo para cargas gerais no eixo SP-RJ', 12
WHERE NOT EXISTS (SELECT 1 FROM load_models WHERE name = 'SP → RJ Carga Geral');


-- 1. Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for contract_templates
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for contract_templates
DROP POLICY IF EXISTS "Allow public read access for contract_templates" ON contract_templates;
CREATE POLICY "Allow public read access for contract_templates" ON contract_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert for contract_templates" ON contract_templates;
CREATE POLICY "Allow authenticated insert for contract_templates" ON contract_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update for contract_templates" ON contract_templates;
CREATE POLICY "Allow authenticated update for contract_templates" ON contract_templates FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete for contract_templates" ON contract_templates;
CREATE POLICY "Allow authenticated delete for contract_templates" ON contract_templates FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Add whatsapp_group_id to loads table
ALTER TABLE loads 
ADD COLUMN IF NOT EXISTS whatsapp_group_id UUID REFERENCES groups(id);

COMMENT ON COLUMN loads.whatsapp_group_id IS 'Reference to the WhatsApp group associated with this load';
