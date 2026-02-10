import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ekimcihxrnigghnappjv.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não configurada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function copyData() {
  try {
    console.log('🔄 Buscando cargas da tabela "cargas"...')

    // Buscar todas as cargas
    const { data: cargas, error: fetchError } = await supabase
      .from('cargas')
      .select('*')

    if (fetchError) {
      console.error('❌ Erro ao buscar cargas:', fetchError)
      return
    }

    console.log(`📦 Encontradas ${cargas?.length || 0} cargas`)

    if (!cargas || cargas.length === 0) {
      console.log('⚠️  Nenhuma carga encontrada na tabela "cargas"')
      return
    }

    // Mapear cargas para o formato loads
    const loads = cargas.map(carga => {
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

      return {
        id: carga.id,
        title: carga.numero_carga,
        origin: `${carga.origem_cidade} - ${carga.origem_estado}`,
        destination: `${carga.destino_cidade} - ${carga.destino_estado}`,
        value: `R$ ${carga.valor_frete || 0}`,
        status: statusMap[carga.status] || 'registration',
        priority: 'normal',
        column_id: statusMap[carga.status] || 'registration',
        driver_id: carga.motorista_id,
        created_at: carga.created_at,
        updated_at: carga.updated_at
      }
    })

    console.log('💾 Inserindo cargas na tabela "loads"...')

    // Inserir em loads (upsert)
    const { data: inserted, error: insertError } = await supabase
      .from('loads')
      .upsert(loads, { onConflict: 'id' })

    if (insertError) {
      console.error('❌ Erro ao inserir cargas:', insertError)
      return
    }

    console.log(`✅ ${loads.length} cargas copiadas com sucesso para "loads"!`)

    // Verificar total
    const { count, error: countError } = await supabase
      .from('loads')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`📊 Total de cargas na tabela "loads": ${count}`)
    }

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

copyData()
