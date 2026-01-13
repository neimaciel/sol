import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // GET /load/{loadId} - Get payment by load_id
    if (method === 'GET' && pathParts[2] === 'load' && pathParts.length >= 4) {
      const loadId = pathParts[3]

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          load:loads(*),
          driver:drivers(*)
        `)
        .eq('load_id', loadId)
        .maybeSingle()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ payment: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /methods - Get payment methods
    if (method === 'GET' && pathParts[2] === 'methods') {
      const methods = [
        {
          id: 'MANUAL',
          name: 'Transferência Manual',
          type: 'MANUAL',
          requires_bank_data: true,
          supports_instant: false,
          processing_time: '1-3 dias úteis'
        },
        {
          id: 'PIX',
          name: 'PIX',
          type: 'PIX',
          requires_bank_data: true,
          supports_instant: true,
          processing_time: 'Instantâneo'
        }
      ]

      return new Response(JSON.stringify({ methods }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // GET /{paymentId} - Get specific payment
    if (method === 'GET' && pathParts.length >= 3) {
      const paymentId = pathParts[2]

      if (paymentId && paymentId !== 'load' && paymentId !== 'methods') {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            load:loads(*),
            driver:drivers(*)
          `)
          .eq('id', paymentId)
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
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          load:loads(*),
          driver:drivers(*)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // POST /{paymentId}/confirm - Confirm manual payment
    if (method === 'POST' && pathParts.length >= 4 && pathParts[3] === 'confirm') {
      const paymentId = pathParts[2]
      const body = await req.json()

      const now = new Date().toISOString()

      // Get authenticated user from JWT
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return new Response(JSON.stringify({ code: 401, message: 'Unauthorized' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'MANUAL_CONFIRMED',
          manual_confirmed_by: body.confirmed_by || user.id,
          manual_confirmed_at: now,
          manual_confirmation_notes: body.notes,
          receipt_url: body.receipt_url,
          processed_at: now
        })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({
        success: true,
        confirmed_at: now,
        payment: data
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // POST - Create new payment
    if (method === 'POST') {
      const body = await req.json()

      const { data, error } = await supabase
        .from('payments')
        .insert([{
          ...body,
          created_at: new Date().toISOString(),
          status: body.status || 'PENDING'
        }])
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
      const paymentId = pathParts[2]
      const body = await req.json()
      
      const { data, error } = await supabase
        .from('payments')
        .update(body)
        .eq('id', paymentId)
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
      const paymentId = pathParts[2]
      
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      if (error) {
        throw error
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
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