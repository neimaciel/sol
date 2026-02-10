-- =============================================
-- MIGRAR DADOS DE CARGAS PARA LOADS
-- =============================================
-- Copiar dados das tabelas em português para as tabelas em inglês

-- Primeiro, verificar se as tabelas antigas existem
DO $$
BEGIN
    -- Copiar motoristas para drivers (se a tabela motoristas existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'motoristas') THEN
        RAISE NOTICE 'Copiando dados de motoristas para drivers...';

        INSERT INTO public.drivers (
            id, name, phone, email, vehicle_type, vehicle_plate, status, created_at, updated_at
        )
        SELECT
            id,
            nome as name,
            telefone as phone,
            email,
            'Caminhão' as vehicle_type,  -- valor padrão
            NULL as vehicle_plate,
            CASE
                WHEN status = 'ativo' THEN 'active'
                WHEN status = 'inativo' THEN 'inactive'
                WHEN status = 'ferias' THEN 'vacation'
                ELSE 'active'
            END as status,
            created_at,
            updated_at
        FROM public.motoristas
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE '✅ Dados copiados de motoristas para drivers';
    END IF;

    -- Copiar operadores para operators (se a tabela operadores existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'operadores') THEN
        RAISE NOTICE 'Copiando dados de operadores para operators...';

        -- Assumindo que a tabela operators tem estrutura semelhante
        -- Ajuste conforme necessário baseado no schema real
        RAISE NOTICE '⚠️  Copiar operators requer mapeamento manual - verifique o schema';
    END IF;

    -- Copiar cargas para loads (se a tabela cargas existir)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cargas') THEN
        RAISE NOTICE 'Copiando dados de cargas para loads...';

        INSERT INTO public.loads (
            id,
            title,
            origin,
            destination,
            value,
            status,
            priority,
            column_id,
            driver_id,
            created_at,
            updated_at
        )
        SELECT
            id,
            numero_carga as title,
            CONCAT(origem_cidade, ' - ', origem_estado) as origin,
            CONCAT(destino_cidade, ' - ', destino_estado) as destination,
            CONCAT('R$ ', COALESCE(valor_frete::text, '0')) as value,
            CASE
                WHEN status = 'pendente' THEN 'registration'
                WHEN status = 'aguardando_coleta' THEN 'risk_analysis'
                WHEN status = 'em_coleta' THEN 'documentation'
                WHEN status = 'em_transito' THEN 'in_transit'
                WHEN status = 'em_parada' THEN 'in_transit'
                WHEN status = 'em_entrega' THEN 'delivery'
                WHEN status = 'entregue' THEN 'completed'
                WHEN status = 'cancelada' THEN 'registration'
                ELSE 'registration'
            END as status,
            'normal' as priority,
            CASE
                WHEN status = 'pendente' THEN 'registration'
                WHEN status = 'aguardando_coleta' THEN 'risk_analysis'
                WHEN status = 'em_coleta' THEN 'documentation'
                WHEN status = 'em_transito' THEN 'in_transit'
                WHEN status = 'em_parada' THEN 'in_transit'
                WHEN status = 'em_entrega' THEN 'delivery'
                WHEN status = 'entregue' THEN 'completed'
                WHEN status = 'cancelada' THEN 'registration'
                ELSE 'registration'
            END as column_id,
            motorista_id as driver_id,
            created_at,
            updated_at
        FROM public.cargas
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            origin = EXCLUDED.origin,
            destination = EXCLUDED.destination,
            value = EXCLUDED.value,
            status = EXCLUDED.status,
            column_id = EXCLUDED.column_id,
            driver_id = EXCLUDED.driver_id,
            updated_at = NOW();

        RAISE NOTICE '✅ Dados copiados de cargas para loads';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 Migração de dados concluída!';
    RAISE NOTICE 'Total de cargas migradas para loads table';
END $$;

-- Verificar quantos registros temos em cada tabela
DO $$
DECLARE
    loads_count INTEGER;
    drivers_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO loads_count FROM public.loads;
    SELECT COUNT(*) INTO drivers_count FROM public.drivers;

    RAISE NOTICE '';
    RAISE NOTICE '📊 Status das tabelas:';
    RAISE NOTICE '   - loads: % registros', loads_count;
    RAISE NOTICE '   - drivers: % registros', drivers_count;
END $$;
