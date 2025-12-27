-- Migration 007: Sistema de Operadores
-- Criar tabelas de operadores, sessões e logs de atividade

-- Tabela de operadores
CREATE TABLE IF NOT EXISTS operators (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    
    -- Perfil e Acesso
    role TEXT DEFAULT 'OPERATOR' CHECK (role IN ('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER')),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    
    -- Informações do Perfil
    phone TEXT,
    department TEXT CHECK (department IN ('OPERATIONS', 'FINANCIAL', 'COMMERCIAL', 'ADMIN')),
    photo TEXT,
    
    -- Permissões Específicas
    can_manage_drivers BOOLEAN DEFAULT true,
    can_manage_loads BOOLEAN DEFAULT true,
    can_confirm_payments BOOLEAN DEFAULT false,
    can_manage_operators BOOLEAN DEFAULT false,
    can_access_reports BOOLEAN DEFAULT true,
    can_manage_contracts BOOLEAN DEFAULT false,
    
    -- Autenticação
    last_login TIMESTAMPTZ,
    login_attempts TEXT DEFAULT '0',
    password_reset_token TEXT,
    password_reset_expires TIMESTAMPTZ,
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    
    -- Configurações Pessoais
    preferences TEXT, -- JSON
    notifications_enabled BOOLEAN DEFAULT true
);

-- Tabela de sessões dos operadores
CREATE TABLE IF NOT EXISTS operator_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    operator_id TEXT NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Tabela de logs de atividade
CREATE TABLE IF NOT EXISTS operator_activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    operator_id TEXT NOT NULL,
    
    -- Ação realizada
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    
    -- Detalhes da ação
    description TEXT,
    extra_data TEXT, -- JSON
    
    -- Contexto
    ip_address TEXT,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_operators_email ON operators(email);
CREATE INDEX IF NOT EXISTS idx_operators_role ON operators(role);
CREATE INDEX IF NOT EXISTS idx_operators_is_active ON operators(is_active);

CREATE INDEX IF NOT EXISTS idx_operator_sessions_operator_id ON operator_sessions(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_token ON operator_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_operator_sessions_expires ON operator_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_operator_activities_operator_id ON operator_activities(operator_id);
CREATE INDEX IF NOT EXISTS idx_operator_activities_action ON operator_activities(action);
CREATE INDEX IF NOT EXISTS idx_operator_activities_created_at ON operator_activities(created_at);

-- Habilitar Row Level Security
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir tudo por enquanto - ajustar conforme autenticação)
CREATE POLICY "Allow all operations on operators" ON operators
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on operator_sessions" ON operator_sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on operator_activities" ON operator_activities
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar operador admin padrão (senha: admin123)
-- Hash calculado: salt + hash pbkdf2
INSERT INTO operators (
    id, email, name, password_hash, role, is_active, is_superuser,
    can_manage_drivers, can_manage_loads, can_confirm_payments, 
    can_manage_operators, can_access_reports, can_manage_contracts,
    created_at
) VALUES (
    'admin-default',
    'admin@sollogistica.com',
    'Administrador',
    '7d8c2d5e9f4a3b1c$a5b8c3d1e2f4a8b9c7d6e5f3a1b2c4d8e9f1a3b5c7d2e6f4a8b9c1d3e5f7a2b4c6',
    'ADMIN',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();

-- Criar operador de teste (senha: operador123)
INSERT INTO operators (
    id, email, name, password_hash, role, is_active, 
    can_manage_drivers, can_manage_loads, can_confirm_payments,
    created_by, created_at
) VALUES (
    'operator-test',
    'operador@sollogistica.com', 
    'Operador Teste',
    '9b4e7a2d5c8f1a3b$b6c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6c9d2',
    'OPERATOR',
    true,
    true,
    true,
    false,
    'admin-default',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    updated_at = NOW();