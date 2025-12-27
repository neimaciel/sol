-- Criar tabelas no Supabase para SOL Logistics

-- Tabela loads
CREATE TABLE IF NOT EXISTS loads (
    id TEXT PRIMARY KEY,
    title TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    value TEXT,
    status TEXT DEFAULT 'registration',
    column_id TEXT DEFAULT 'broadcast',
    driver_id TEXT,
    payment_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW(),
    vehicle_type TEXT,
    broadcast_status TEXT,
    whatsapp_group_id TEXT,
    sent_groups TEXT[]
);

-- Tabela drivers  
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    photo TEXT,
    rating DECIMAL DEFAULT 0,
    trips_count INTEGER DEFAULT 0,
    category TEXT DEFAULT 'Bronze',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela groups
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    description TEXT,
    region TEXT,
    whatsapp_link TEXT,
    whatsapp_id TEXT,
    members_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir dados de exemplo
INSERT INTO loads (id, title, origin, destination, value, status, column_id, created_at) 
VALUES ('load-example-1', 'Carga São Paulo → Rio de Janeiro', 'São Paulo, SP', 'Rio de Janeiro, RJ', '5000.00', 'registration', 'broadcast', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir grupo de exemplo
INSERT INTO groups (id, name, type, description, region, whatsapp_link, whatsapp_id, members_count, created_at)
VALUES ('group-example-1', 'Teste Produção', 'Frota Própria', 'Grupo de teste para produção', 'São Paulo', 'https://chat.whatsapp.com/test', '120363403673457886@g.us', 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir acesso público de leitura
CREATE POLICY IF NOT EXISTS "Allow public read access on loads" ON loads FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access on drivers" ON drivers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow public read access on groups" ON groups FOR SELECT USING (true);

-- Permitir inserção pública para candidatos (motoristas que se candidatam)
CREATE POLICY IF NOT EXISTS "Allow public insert on drivers" ON drivers FOR INSERT WITH CHECK (true);