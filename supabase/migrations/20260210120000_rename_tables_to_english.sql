-- =============================================
-- RENOMEAR TABELAS PARA INGLÊS
-- =============================================
-- O frontend espera tabelas em inglês (loads, drivers, operators)
-- Esta migration renomeia as tabelas mantendo todos os dados

-- Renomear motoristas para drivers
ALTER TABLE IF EXISTS public.motoristas RENAME TO drivers;

-- Renomear operadores para operators
ALTER TABLE IF EXISTS public.operadores RENAME TO operators;

-- Renomear cargas para loads
ALTER TABLE IF EXISTS public.cargas RENAME TO loads;

-- Renomear historico_status_carga para load_status_history
ALTER TABLE IF EXISTS public.historico_status_carga RENAME TO load_status_history;

-- Atualizar foreign keys (os nomes das constraints precisam ser atualizados)
ALTER TABLE IF EXISTS public.loads
  DROP CONSTRAINT IF EXISTS cargas_motorista_id_fkey,
  ADD CONSTRAINT loads_driver_id_fkey
    FOREIGN KEY (motorista_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.loads
  DROP CONSTRAINT IF EXISTS cargas_operador_responsavel_id_fkey,
  ADD CONSTRAINT loads_operator_id_fkey
    FOREIGN KEY (operador_responsavel_id) REFERENCES public.operators(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS public.load_status_history
  DROP CONSTRAINT IF EXISTS historico_status_carga_carga_id_fkey,
  ADD CONSTRAINT load_status_history_load_id_fkey
    FOREIGN KEY (carga_id) REFERENCES public.loads(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.load_status_history
  DROP CONSTRAINT IF EXISTS historico_status_carga_alterado_por_fkey,
  ADD CONSTRAINT load_status_history_operator_id_fkey
    FOREIGN KEY (alterado_por) REFERENCES public.operators(id);

-- Renomear colunas para inglês na tabela loads
ALTER TABLE IF EXISTS public.loads
  RENAME COLUMN motorista_id TO driver_id;

ALTER TABLE IF EXISTS public.loads
  RENAME COLUMN operador_responsavel_id TO operator_id;

-- Renomear colunas na tabela load_status_history
ALTER TABLE IF EXISTS public.load_status_history
  RENAME COLUMN carga_id TO load_id;

ALTER TABLE IF EXISTS public.load_status_history
  RENAME COLUMN alterado_por TO changed_by_operator_id;

-- Atualizar índices
DROP INDEX IF EXISTS idx_cargas_status;
DROP INDEX IF EXISTS idx_cargas_motorista;
DROP INDEX IF EXISTS idx_cargas_operador;
DROP INDEX IF EXISTS idx_cargas_data_criacao;
DROP INDEX IF EXISTS idx_cargas_numero;
DROP INDEX IF EXISTS idx_motoristas_status;
DROP INDEX IF EXISTS idx_operadores_status;
DROP INDEX IF EXISTS idx_historico_carga;

CREATE INDEX IF NOT EXISTS idx_loads_status ON public.loads(status);
CREATE INDEX IF NOT EXISTS idx_loads_driver ON public.loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_operator ON public.loads(operator_id);
CREATE INDEX IF NOT EXISTS idx_loads_created_at ON public.loads(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_loads_numero ON public.loads(numero_carga);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_operators_status ON public.operators(status);
CREATE INDEX IF NOT EXISTS idx_load_history ON public.load_status_history(load_id, data_alteracao DESC);

-- Atualizar comentários
COMMENT ON TABLE public.drivers IS 'Drivers/Motoristas cadastrados';
COMMENT ON TABLE public.operators IS 'System operators/users';
COMMENT ON TABLE public.loads IS 'All transportation loads';
COMMENT ON TABLE public.load_status_history IS 'History of load status changes';

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Tabelas renomeadas com sucesso!';
    RAISE NOTICE '   - motoristas → drivers';
    RAISE NOTICE '   - operadores → operators';
    RAISE NOTICE '   - cargas → loads';
    RAISE NOTICE '   - historico_status_carga → load_status_history';
END $$;
