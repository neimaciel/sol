-- Create groups table
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

-- Create load_models table
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

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE load_models ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
CREATE POLICY "Allow public read access for groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert for groups" ON groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update for groups" ON groups FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete for groups" ON groups FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for load_models
CREATE POLICY "Allow public read access for load_models" ON load_models FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert for load_models" ON load_models FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update for load_models" ON load_models FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete for load_models" ON load_models FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some initial mock data for groups
INSERT INTO groups (name, type, description, members_count, region) VALUES
('Carretas SP-RJ', 'Carreta', 'Grupo para ofertas de cargas com carretas no eixo SP-RJ', 234, 'Sudeste'),
('Trucks Sul', 'Truck', 'Motoristas de truck da região sul', 156, 'Sul'),
('VUCs Grande SP', 'Vuc', 'Distribuição urbana na Grande São Paulo', 89, 'São Paulo');

-- Insert some initial mock data for load_models
INSERT INTO load_models (name, type, vehicle_type, origin, destination, description, usage_count) VALUES
('MG → SP Fracionada', 'Fracionada', 'Van', 'Belo Horizonte, MG', 'São Paulo, SP', 'Modelo para cargas fracionadas de MG para SP', 5),
('PR → SC Refrigerada', 'Refrigerada', 'Carreta', 'Curitiba, PR', 'Florianópolis, SC', 'Modelo para cargas refrigeradas entre PR e SC', 8),
('SP → RJ Carga Geral', 'Carga Geral', 'Truck', 'São Paulo, SP', 'Rio de Janeiro, RJ', 'Modelo para cargas gerais no eixo SP-RJ', 12);
