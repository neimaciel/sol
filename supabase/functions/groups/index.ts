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
    console.log('🔍 [GROUPS] Authorization header:', authHeader ? 'Present' : 'Missing')

    if (!authHeader) {
      console.error('❌ [GROUPS] Missing Authorization header')
      return new Response(JSON.stringify({ code: 401, message: 'Missing Authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 [GROUPS] Token extracted:', token.substring(0, 50) + '...')

    // Create Supabase client with user's JWT token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    console.log('🌐 [GROUPS] Supabase URL:', supabaseUrl)
    console.log('🔐 [GROUPS] Using ANON key:', supabaseAnonKey.substring(0, 30) + '...')

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    })

    console.log('✅ [GROUPS] Supabase client created successfully')

    // RLS (Row Level Security) will validate the JWT token automatically

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const method = req.method

    // Routes
    if (method === 'GET' && pathParts.length >= 3) {
      const groupId = pathParts[2]
      
      if (groupId) {
        // Get specific group
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
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
      // Get all groups
      console.log('📋 [GROUPS] Fetching all groups...')
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [GROUPS] Error fetching groups:', error)
        console.error('❌ [GROUPS] Error code:', error.code)
        console.error('❌ [GROUPS] Error message:', error.message)
        console.error('❌ [GROUPS] Error details:', error.details)
        console.error('❌ [GROUPS] Error hint:', error.hint)
        return new Response(JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      console.log('✅ [GROUPS] Successfully fetched', data?.length || 0, 'groups')
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'POST') {
      // Create new group
      console.log('➕ [GROUPS] Creating new group...')
      const body = await req.json()
      console.log('📝 [GROUPS] Request body:', JSON.stringify(body))

      const { data, error } = await supabase
        .from('groups')
        .insert([body])
        .select()
        .single()

      if (error) {
        console.error('❌ [GROUPS] Error creating group:', error)
        console.error('❌ [GROUPS] Error code:', error.code)
        console.error('❌ [GROUPS] Error message:', error.message)
        console.error('❌ [GROUPS] Error details:', error.details)
        console.error('❌ [GROUPS] Error hint:', error.hint)
        return new Response(JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      console.log('✅ [GROUPS] Group created successfully:', data?.id)
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      })
    }

    if (method === 'POST' && url.pathname.includes('/broadcast')) {
      // Broadcast message to WhatsApp groups
      const body = await req.json()
      const { loadId, groupIds, message } = body

      // Here you would integrate with WhatsApp Evolution API
      const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
      const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')

      const results = []
      
      for (const groupId of groupIds) {
        // Get group details
        const { data: group } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single()

        if (group && group.whatsapp_id) {
          // Send message via Evolution API (if configured)
          if (evolutionApiUrl && evolutionApiKey) {
            try {
              const response = await fetch(`${evolutionApiUrl}/message/sendText/sol_logistica`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': evolutionApiKey
                },
                body: JSON.stringify({
                  number: group.whatsapp_id,
                  text: message
                })
              })
              
              const result = await response.json()
              results.push({ groupId, success: response.ok, result })
            } catch (error) {
              results.push({ groupId, success: false, error: error.message })
            }
          } else {
            // Mock success for testing
            results.push({ groupId, success: true, message: 'WhatsApp API not configured' })
          }
        }
      }

      // Update load with broadcast status
      await supabase
        .from('loads')
        .update({ 
          status: 'broadcast',
          broadcast_status: 'sent',
          sent_groups: groupIds
        })
        .eq('id', loadId)

      return new Response(JSON.stringify({ 
        success: true, 
        results,
        message: 'Broadcast completed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404,
    })

  } catch (error) {
    console.error('💥 [GROUPS] Unhandled error:', error)
    console.error('💥 [GROUPS] Error stack:', error.stack)
    console.error('💥 [GROUPS] Error details:', JSON.stringify(error, null, 2))
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})