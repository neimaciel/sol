import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ code: 401, message: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with user's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    })

    // RLS (Row Level Security) will validate the JWT token automatically

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const method = req.method

    // Routes
    if (method === 'GET' && pathParts.length >= 3) {
      const loadId = pathParts[2]
      
      if (loadId) {
        // Get specific load
        const { data, error } = await supabase
          .from('loads')
          .select(`
            *,
            driver:drivers(*)
          `)
          .eq('id', loadId)
          .single()

        if (error) {
          throw error
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    if (method === 'GET') {
      // Get all loads with pagination
      const limit = parseInt(url.searchParams.get('limit') || '100')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      const { data, error } = await supabase
        .from('loads')
        .select(`
          *,
          driver:drivers(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'POST') {
      // Create new load
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('loads')
        .insert([body])
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    if (method === 'PUT' && pathParts.length >= 3) {
      // Update load
      const loadId = pathParts[2]
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('loads')
        .update(body)
        .eq('id', loadId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'DELETE' && pathParts.length >= 3) {
      // Delete load
      const loadId = pathParts[2]
      
      const { error } = await supabase
        .from('loads')
        .delete()
        .eq('id', loadId)

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // POST /loads/{loadId}/auto-advance - Auto-advance load through workflow
    if (method === 'POST' && pathParts.length >= 4 && pathParts[3] === 'auto-advance') {
      const loadId = pathParts[2]
      console.log('🚀 [LOADS] Auto-advancing load:', loadId)

      // Get current load
      const { data: load, error: fetchError } = await supabase
        .from('loads')
        .select('*')
        .eq('id', loadId)
        .single()

      if (fetchError || !load) {
        return new Response(JSON.stringify({ error: 'Load not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      }

      // Define workflow transitions
      const workflow = {
        'registration': { next: 'risk_analysis', conditions: ['has_basic_info'] },
        'risk_analysis': { next: 'documentation', conditions: ['risk_approved'] },
        'documentation': { next: 'negotiation', conditions: ['docs_complete'] },
        'negotiation': { next: 'contract', conditions: ['driver_selected'] },
        'contract': { next: 'in_transit', conditions: ['contract_signed'] },
        'in_transit': { next: 'delivery', conditions: ['started_trip'] },
        'delivery': { next: 'payment', conditions: ['delivered'] },
        'payment': { next: 'completed', conditions: ['payment_confirmed'] }
      }

      const currentColumn = load.column_id || 'registration'
      const transition = workflow[currentColumn]

      if (!transition) {
        return new Response(JSON.stringify({
          success: false,
          message: 'No transition defined for current column',
          current_column: currentColumn
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // Check conditions (simplified - you can expand this)
      let canAdvance = true
      const missingConditions = []

      // Basic validation examples
      if (transition.conditions.includes('has_basic_info')) {
        if (!load.origin || !load.destination || !load.value) {
          canAdvance = false
          missingConditions.push('has_basic_info')
        }
      }

      if (transition.conditions.includes('driver_selected')) {
        if (!load.driver_id) {
          canAdvance = false
          missingConditions.push('driver_selected')
        }
      }

      if (transition.conditions.includes('risk_approved')) {
        if (load.risk_status !== 'approved') {
          canAdvance = false
          missingConditions.push('risk_approved')
        }
      }

      if (transition.conditions.includes('docs_complete')) {
        // Check if required documents are uploaded
        const requiredDocs = ['cnh_url', 'vehicle_doc_url', 'insurance_url']
        const missingDocs = requiredDocs.filter(doc => !load[doc])
        if (missingDocs.length > 0) {
          canAdvance = false
          missingConditions.push('docs_complete')
        }
      }

      if (transition.conditions.includes('contract_signed')) {
        if (!load.contract_signed_at) {
          canAdvance = false
          missingConditions.push('contract_signed')
        }
      }

      if (transition.conditions.includes('started_trip')) {
        if (!load.trip_started_at) {
          canAdvance = false
          missingConditions.push('started_trip')
        }
      }

      if (transition.conditions.includes('delivered')) {
        if (!load.delivered_at) {
          canAdvance = false
          missingConditions.push('delivered')
        }
      }

      if (transition.conditions.includes('payment_confirmed')) {
        if (!load.payment_confirmed_at) {
          canAdvance = false
          missingConditions.push('payment_confirmed')
        }
      }

      if (canAdvance) {
        // Advance to next column
        const { data: updatedLoad, error: updateError } = await supabase
          .from('loads')
          .update({
            column_id: transition.next,
            updated_at: new Date().toISOString()
          })
          .eq('id', loadId)
          .select()
          .single()

        if (updateError) {
          throw updateError
        }

        console.log(`✅ [LOADS] Load advanced from ${currentColumn} to ${transition.next}`)
        return new Response(JSON.stringify({
          success: true,
          load: updatedLoad,
          previous_column: currentColumn,
          new_column: transition.next
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: 'Conditions not met for advancement',
          missing_conditions: missingConditions,
          current_column: currentColumn
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})