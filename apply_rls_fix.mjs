#!/usr/bin/env node

import { readFileSync } from 'fs'

const SUPABASE_URL = 'https://ekimcihxrnigghnappjv.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwMTM2OCwiZXhwIjoyMDgyMzc3MzY4fQ.krPxL5WPgrppk3qYn9lLD95QHA3dR29MalihbXv3kHY'

console.log('🔐 Aplicando correções de RLS...\n')

// Ler SQL
const sql = readFileSync('./supabase/migrations/20260210140000_fix_rls_policies.sql', 'utf8')

// Executar
try {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Erro ao executar SQL:', error)
    process.exit(1)
  }

  console.log('✅ Políticas RLS aplicadas com sucesso!\n')
  console.log('📋 Políticas criadas:')
  console.log('   - loads: Segregação por operator_id')
  console.log('   - drivers: Permissões por role')
  console.log('   - operators: Ver apenas próprio perfil')
  console.log('   - groups: Todos podem ver')
  console.log('   - payments: Vinculado a cargas')
  console.log('   - candidates: Vinculado a cargas')
  console.log('')
  console.log('🔒 Segurança aprimorada!')

} catch (error) {
  console.error('❌ Erro:', error.message)
  process.exit(1)
}
