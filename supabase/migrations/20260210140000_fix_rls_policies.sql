-- =============================================
-- CORRIGIR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =============================================
-- Bug ID: P21
-- Problema: Políticas muito permissivas permitem que qualquer
--           usuário autenticado veja TODOS os dados
-- Solução: Implementar segregação por operador/empresa e RBAC

-- =============================================
-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA LIMPEZA
-- =============================================
ALTER TABLE IF EXISTS loads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS load_models DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. REMOVER TODAS AS POLÍTICAS ANTIGAS
-- =============================================

-- Loads
DROP POLICY IF EXISTS "Allow authenticated users to select loads" ON loads;
DROP POLICY IF EXISTS "Allow authenticated users to insert loads" ON loads;
DROP POLICY IF EXISTS "Allow authenticated users to update loads" ON loads;
DROP POLICY IF EXISTS "Allow authenticated users to delete loads" ON loads;

-- Drivers
DROP POLICY IF EXISTS "Allow authenticated users to select drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to insert drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to update drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to delete drivers" ON drivers;

-- Operators
DROP POLICY IF EXISTS "Allow authenticated users to select operators" ON operators;
DROP POLICY IF EXISTS "Allow authenticated users to insert operators" ON operators;
DROP POLICY IF EXISTS "Allow authenticated users to update operators" ON operators;
DROP POLICY IF EXISTS "Allow authenticated users to delete operators" ON operators;

-- Groups
DROP POLICY IF EXISTS "Allow authenticated users to select groups" ON groups;
DROP POLICY IF EXISTS "Allow authenticated users to insert groups" ON groups;
DROP POLICY IF EXISTS "Allow authenticated users to update groups" ON groups;
DROP POLICY IF EXISTS "Allow authenticated users to delete groups" ON groups;

-- Payments
DROP POLICY IF EXISTS "Allow authenticated users to select payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert payments" ON payments;
DROP POLICY IF EXISTS "Allow authenticated users to update payments" ON payments;

-- Candidates
DROP POLICY IF EXISTS "Allow authenticated users to select candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated users to insert candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated users to update candidates" ON candidates;
DROP POLICY IF EXISTS "Allow authenticated users to delete candidates" ON candidates;

-- Load Models
DROP POLICY IF EXISTS "Allow authenticated users to select load_models" ON load_models;
DROP POLICY IF EXISTS "Allow authenticated users to insert load_models" ON load_models;
DROP POLICY IF EXISTS "Allow authenticated users to update load_models" ON load_models;
DROP POLICY IF EXISTS "Allow authenticated users to delete load_models" ON load_models;

-- =============================================
-- 3. HELPER FUNCTIONS PARA RLS
-- =============================================

-- Função: Pegar o ID do usuário atual do JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE SQL STABLE;

-- Função: Verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM operators
    WHERE id = auth.user_id()
    AND (
      role = 'admin'
      OR permissions->>'gerenciar' = 'true'
    )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Função: Verificar permissão específica
CREATE OR REPLACE FUNCTION public.has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM operators
    WHERE id = auth.user_id()
    AND (
      role = 'admin'
      OR permissions->>permission_name = 'true'
    )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- =============================================
-- 4. POLÍTICAS RLS PARA LOADS (CARGAS)
-- =============================================

ALTER TABLE loads ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver apenas cargas que o operador criou OU se for admin
CREATE POLICY "operators_can_select_own_loads"
ON loads FOR SELECT
TO authenticated
USING (
  operator_id = auth.user_id()
  OR is_admin()
);

-- INSERT: Operadores com permissão 'editar' podem criar
CREATE POLICY "operators_can_insert_loads"
ON loads FOR INSERT
TO authenticated
WITH CHECK (
  has_permission('editar')
  AND operator_id = auth.user_id()
);

-- UPDATE: Pode atualizar próprias cargas OU admin
CREATE POLICY "operators_can_update_own_loads"
ON loads FOR UPDATE
TO authenticated
USING (
  operator_id = auth.user_id()
  OR is_admin()
)
WITH CHECK (
  operator_id = auth.user_id()
  OR is_admin()
);

-- DELETE: Apenas admins podem deletar
CREATE POLICY "only_admins_can_delete_loads"
ON loads FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- 5. POLÍTICAS RLS PARA DRIVERS (MOTORISTAS)
-- =============================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos podem ver motoristas (necessário para atribuir a cargas)
CREATE POLICY "authenticated_users_can_select_drivers"
ON drivers FOR SELECT
TO authenticated
USING (true);

-- INSERT: Apenas com permissão 'editar' ou admin
CREATE POLICY "operators_with_permission_can_insert_drivers"
ON drivers FOR INSERT
TO authenticated
WITH CHECK (
  has_permission('editar')
  OR is_admin()
);

-- UPDATE: Apenas com permissão 'editar' ou admin
CREATE POLICY "operators_with_permission_can_update_drivers"
ON drivers FOR UPDATE
TO authenticated
USING (
  has_permission('editar')
  OR is_admin()
);

-- DELETE: Apenas admins
CREATE POLICY "only_admins_can_delete_drivers"
ON drivers FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- 6. POLÍTICAS RLS PARA OPERATORS
-- =============================================

ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver apenas próprio perfil OU admin vê todos
CREATE POLICY "operators_can_select_self_or_admin_sees_all"
ON operators FOR SELECT
TO authenticated
USING (
  id = auth.user_id()
  OR is_admin()
);

-- INSERT: Apenas admins podem criar operadores
CREATE POLICY "only_admins_can_insert_operators"
ON operators FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- UPDATE: Pode atualizar próprio perfil OU admin
CREATE POLICY "operators_can_update_self_or_admin"
ON operators FOR UPDATE
TO authenticated
USING (
  id = auth.user_id()
  OR is_admin()
)
WITH CHECK (
  id = auth.user_id()
  OR is_admin()
);

-- DELETE: Apenas admins
CREATE POLICY "only_admins_can_delete_operators"
ON operators FOR DELETE
TO authenticated
USING (is_admin());

-- =============================================
-- 7. POLÍTICAS RLS PARA GROUPS (GRUPOS WHATSAPP)
-- =============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos podem ver grupos
CREATE POLICY "authenticated_users_can_select_groups"
ON groups FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Apenas com permissão ou admin
CREATE POLICY "operators_with_permission_can_manage_groups"
ON groups FOR ALL
TO authenticated
USING (
  has_permission('editar')
  OR is_admin()
);

-- =============================================
-- 8. POLÍTICAS RLS PARA PAYMENTS
-- =============================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver pagamentos das próprias cargas OU admin
CREATE POLICY "operators_can_select_payments_of_own_loads"
ON payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = payments.load_id
    AND loads.operator_id = auth.user_id()
  )
  OR is_admin()
);

-- INSERT: Criar pagamento para próprias cargas
CREATE POLICY "operators_can_insert_payments_for_own_loads"
ON payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = payments.load_id
    AND loads.operator_id = auth.user_id()
  )
  OR is_admin()
);

-- UPDATE: Atualizar pagamentos de próprias cargas OU admin
CREATE POLICY "operators_can_update_payments_of_own_loads"
ON payments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = payments.load_id
    AND loads.operator_id = auth.user_id()
  )
  OR is_admin()
);

-- =============================================
-- 9. POLÍTICAS RLS PARA CANDIDATES
-- =============================================

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver candidatos das próprias cargas
CREATE POLICY "operators_can_select_candidates_of_own_loads"
ON candidates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = candidates.load_id
    AND loads.operator_id = auth.user_id()
  )
  OR is_admin()
);

-- INSERT/UPDATE/DELETE: Gerenciar candidatos de próprias cargas
CREATE POLICY "operators_can_manage_candidates_of_own_loads"
ON candidates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM loads
    WHERE loads.id = candidates.load_id
    AND loads.operator_id = auth.user_id()
  )
  OR is_admin()
);

-- =============================================
-- 10. POLÍTICAS RLS PARA LOAD_MODELS (TEMPLATES)
-- =============================================

ALTER TABLE load_models ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos podem ver templates
CREATE POLICY "authenticated_users_can_select_load_models"
ON load_models FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Apenas com permissão ou admin
CREATE POLICY "operators_with_permission_can_manage_load_models"
ON load_models FOR ALL
TO authenticated
USING (
  has_permission('editar')
  OR is_admin()
);

-- =============================================
-- 11. ATUALIZAR OPERATOR_ID NAS CARGAS EXISTENTES
-- =============================================
-- Como as cargas existentes não têm operator_id, vamos atribuir ao primeiro admin
DO $$
DECLARE
  first_admin_id UUID;
BEGIN
  -- Buscar primeiro operador admin
  SELECT id INTO first_admin_id
  FROM operators
  WHERE role = 'admin'
  OR permissions->>'gerenciar' = 'true'
  LIMIT 1;

  -- Se encontrou admin, atualizar cargas sem operator_id
  IF first_admin_id IS NOT NULL THEN
    UPDATE loads
    SET operator_id = first_admin_id
    WHERE operator_id IS NULL;

    RAISE NOTICE '✅ Cargas sem operator_id atribuídas ao admin: %', first_admin_id;
  ELSE
    RAISE WARNING '⚠️  Nenhum operador admin encontrado. Cargas sem operator_id não foram atualizadas.';
  END IF;
END $$;

-- =============================================
-- 12. COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================
COMMENT ON FUNCTION public.is_admin() IS 'Verifica se usuário atual é administrador';
COMMENT ON FUNCTION public.has_permission(TEXT) IS 'Verifica se usuário tem permissão específica no JSONB permissions';

COMMENT ON POLICY "operators_can_select_own_loads" ON loads IS
  'Operadores veem apenas suas próprias cargas. Admins veem todas.';

COMMENT ON POLICY "only_admins_can_delete_loads" ON loads IS
  'Apenas administradores podem deletar cargas para prevenir perda de dados.';

-- =============================================
-- MENSAGEM DE SUCESSO
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Políticas RLS corrigidas com sucesso!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Resumo das mudanças:';
    RAISE NOTICE '   - Removidas políticas permissivas antigas';
    RAISE NOTICE '   - Criadas políticas baseadas em operador/admin';
    RAISE NOTICE '   - Implementado RBAC (Role-Based Access Control)';
    RAISE NOTICE '   - Segregação de dados por operator_id';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Segurança:';
    RAISE NOTICE '   - Operadores veem apenas suas cargas';
    RAISE NOTICE '   - Admins têm acesso completo';
    RAISE NOTICE '   - Permissões verificadas via JSONB';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE:';
    RAISE NOTICE '   - Cargas sem operator_id foram atribuídas ao primeiro admin';
    RAISE NOTICE '   - Teste as permissões com diferentes usuários';
    RAISE NOTICE '   - Valide que admins têm role="admin" ou permissions.gerenciar=true';
    RAISE NOTICE '';
END $$;
