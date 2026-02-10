-- Copiar dados de cargas para loads
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

SELECT COUNT(*) as total_loads FROM public.loads;
