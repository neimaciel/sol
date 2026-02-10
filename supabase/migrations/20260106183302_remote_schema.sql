-- =============================================
-- SISTEMA DE GESTÃO DE CARGAS - S.O.L
-- =============================================

-- =============================================
-- TABELA: motoristas
-- =============================================
CREATE TABLE IF NOT EXISTS public.motoristas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    cnh VARCHAR(20) UNIQUE NOT NULL,
    categoria_cnh VARCHAR(5) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    data_nascimento DATE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    data_contratacao DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: operadores
-- =============================================
CREATE TABLE IF NOT EXISTS public.operadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    cargo VARCHAR(100) DEFAULT 'Operador',
    departamento VARCHAR(100),
    data_contratacao DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias')),
    permissoes JSONB DEFAULT '{"visualizar": true, "editar": false, "aprovar": false}',
    foto_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: cargas
-- =============================================
CREATE TABLE IF NOT EXISTS public.cargas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_carga VARCHAR(50) UNIQUE NOT NULL,
    cliente VARCHAR(255) NOT NULL,
    origem_cidade VARCHAR(100) NOT NULL,
    origem_estado VARCHAR(2) NOT NULL,
    origem_endereco TEXT,
    destino_cidade VARCHAR(100) NOT NULL,
    destino_estado VARCHAR(2) NOT NULL,
    destino_endereco TEXT,

    -- Informações da carga
    tipo_carga VARCHAR(100),
    peso_kg DECIMAL(10, 2),
    valor_mercadoria DECIMAL(12, 2),
    valor_frete DECIMAL(10, 2),
    distancia_km DECIMAL(8, 2),

    -- Status Kanban
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'aguardando_coleta',
        'em_coleta',
        'em_transito',
        'em_parada',
        'em_entrega',
        'entregue',
        'cancelada'
    )),

    -- Datas
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_coleta_prevista TIMESTAMP WITH TIME ZONE,
    data_coleta_realizada TIMESTAMP WITH TIME ZONE,
    data_entrega_prevista TIMESTAMP WITH TIME ZONE,
    data_entrega_realizada TIMESTAMP WITH TIME ZONE,

    -- Relacionamentos
    motorista_id UUID REFERENCES public.motoristas(id) ON DELETE SET NULL,
    operador_responsavel_id UUID REFERENCES public.operadores(id) ON DELETE SET NULL,

    -- Documentação
    nota_fiscal VARCHAR(100),
    cte VARCHAR(100),
    documentos JSONB DEFAULT '[]',

    -- Observações e tracking
    observacoes TEXT,
    historico JSONB DEFAULT '[]',
    localizacao_atual JSONB,

    -- Avaliação
    avaliacao_cliente INTEGER CHECK (avaliacao_cliente BETWEEN 1 AND 5),
    feedback_cliente TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: historico_status_carga
-- =============================================
CREATE TABLE IF NOT EXISTS public.historico_status_carga (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    carga_id UUID REFERENCES public.cargas(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    observacao TEXT,
    alterado_por UUID REFERENCES public.operadores(id),
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES para melhor performance
-- =============================================
CREATE INDEX idx_cargas_status ON public.cargas(status);
CREATE INDEX idx_cargas_motorista ON public.cargas(motorista_id);
CREATE INDEX idx_cargas_operador ON public.cargas(operador_responsavel_id);
CREATE INDEX idx_cargas_data_criacao ON public.cargas(data_criacao DESC);
CREATE INDEX idx_cargas_numero ON public.cargas(numero_carga);
CREATE INDEX idx_motoristas_status ON public.motoristas(status);
CREATE INDEX idx_operadores_status ON public.operadores(status);
CREATE INDEX idx_historico_carga ON public.historico_status_carga(carga_id, data_alteracao DESC);

-- =============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS para updated_at
-- =============================================
CREATE TRIGGER update_motoristas_updated_at
    BEFORE UPDATE ON public.motoristas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operadores_updated_at
    BEFORE UPDATE ON public.operadores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cargas_updated_at
    BEFORE UPDATE ON public.cargas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNÇÃO: Registrar mudança de status no histórico
-- =============================================
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.historico_status_carga (
            carga_id,
            status_anterior,
            status_novo,
            observacao,
            alterado_por
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            'Mudança automática de status',
            NEW.operador_responsavel_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER para log de status
-- =============================================
CREATE TRIGGER log_carga_status_change
    AFTER UPDATE ON public.cargas
    FOR EACH ROW
    EXECUTE FUNCTION log_status_change();

-- =============================================
-- COMENTÁRIOS nas tabelas
-- =============================================
COMMENT ON TABLE public.motoristas IS 'Cadastro de motoristas da empresa';
COMMENT ON TABLE public.operadores IS 'Cadastro de operadores/usuários do sistema';
COMMENT ON TABLE public.cargas IS 'Registro de todas as cargas transportadas';
COMMENT ON TABLE public.historico_status_carga IS 'Histórico de mudanças de status das cargas';

COMMENT ON COLUMN public.cargas.status IS 'Status atual da carga no fluxo kanban';
COMMENT ON COLUMN public.cargas.historico IS 'Array JSON com eventos e atualizações da carga';
COMMENT ON COLUMN public.cargas.localizacao_atual IS 'Última localização GPS registrada';
