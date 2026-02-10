#!/usr/bin/env node

// Credenciais corretas do projeto SOL (ekimcihxrnigghnappjv)
const SUPABASE_URL = 'https://ekimcihxrnigghnappjv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDEzNjgsImV4cCI6MjA4MjM3NzM2OH0.0Ig35iloZLzSUQnvmj9oVSQ2mYmSeWjpdaRudEU5qOo'
// Service role key bypass RLS
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwMTM2OCwiZXhwIjoyMDgyMzc3MzY4fQ.krPxL5WPgrppk3qYn9lLD95QHA3dR29MalihbXv3kHY'

async function copyData() {
  try {
    console.log('🔄 Buscando dados da tabela "cargas"...\n')

    // 1. Buscar todas as cargas
    const cargasResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/cargas?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!cargasResponse.ok) {
      console.error('❌ Erro ao buscar cargas:', await cargasResponse.text())
      return
    }

    const cargas = await cargasResponse.json()
    console.log(`📦 Encontradas ${cargas.length} cargas\n`)

    if (cargas.length === 0) {
      console.log('⚠️  Nenhuma carga encontrada')
      return
    }

    // 2. Mapear status de português para inglês
    const statusMap = {
      'pendente': 'registration',
      'aguardando_coleta': 'risk_analysis',
      'em_coleta': 'documentation',
      'em_transito': 'in_transit',
      'em_parada': 'in_transit',
      'em_entrega': 'delivery',
      'entregue': 'completed',
      'cancelada': 'registration'
    }

    // 3. Transformar cargas para o formato loads
    const loads = cargas.map(carga => ({
      id: carga.id,
      title: carga.numero_carga || `Carga ${carga.id.slice(0, 8)}`,
      origin: `${carga.origem_cidade} - ${carga.origem_estado}`,
      destination: `${carga.destino_cidade} - ${carga.destino_estado}`,
      origin_city: carga.origem_cidade,
      origin_state: carga.origem_estado,
      destination_city: carga.destino_cidade,
      destination_state: carga.destino_estado,
      cargo_type: carga.tipo_carga || 'Geral',
      value: carga.valor_frete ? `${Number(carga.valor_frete).toFixed(2)}` : '0',
      price: carga.valor_frete || 0,
      status: statusMap[carga.status] || 'registration',
      priority: 'normal',
      column_id: statusMap[carga.status] || 'registration',
      driver_id: null, // Ignorar motorista por enquanto (foreign key constraint)
      created_at: carga.created_at,
      updated_at: carga.updated_at || new Date().toISOString()
    }))

    console.log('💾 Inserindo dados na tabela "loads"...\n')

    // 4. Inserir em loads (usando service key para bypass RLS)
    const loadsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/loads`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(loads)
      }
    )

    if (!loadsResponse.ok) {
      const errorText = await loadsResponse.text()
      console.error('❌ Erro ao inserir loads:', errorText)
      return
    }

    console.log(`✅ ${loads.length} cargas copiadas com sucesso!\n`)

    // 5. Verificar total na tabela loads
    const countResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/loads?select=id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        }
      }
    )

    const countHeader = countResponse.headers.get('content-range')
    if (countHeader) {
      const total = countHeader.split('/')[1]
      console.log(`📊 Total de registros na tabela "loads": ${total}\n`)
    }

    console.log('🎉 Migração concluída com sucesso!')
    console.log('\n📋 Distribuição por status:')

    const statusCount = {}
    loads.forEach(load => {
      statusCount[load.column_id] = (statusCount[load.column_id] || 0) + 1
    })

    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} cargas`)
    })

  } catch (error) {
    console.error('❌ Erro fatal:', error.message)
    console.error(error)
  }
}

// Executar
copyData()
