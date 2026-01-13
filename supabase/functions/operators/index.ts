import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const method = req.method

    console.log('Request:', method, url.pathname)

    // Login endpoint: POST /auth/login - NO JWT REQUIRED
    if (method === 'POST' && url.pathname.includes('/auth/login')) {
      console.log('Login route matched!')
      const { email, password } = await req.json()

      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        })
      }

      // Get operator data
      const { data: operator, error: operatorError } = await supabase
        .from('operators')
        .select('*')
        .eq('email', email)
        .single()

      if (operatorError || !operator) {
        return new Response(JSON.stringify({ error: 'Operator not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        })
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Login realizado com sucesso',
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        user: authData.user,
        operator: {
          id: operator.id,
          email: operator.email,
          name: operator.name,
          role: operator.role,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // ===== JWT VALIDATION FOR ALL OTHER ROUTES =====
    // Get JWT token from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ code: 401, message: 'Missing authorization header' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const token = authHeader.replace('Bearer ', '')

    // Create Supabase client with user's JWT token
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    })

    // Verify the JWT token is valid by getting the user
    const { data: { user }, error: userError } = await supabaseWithAuth.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ code: 401, message: 'Invalid JWT' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    // ===== PROTECTED ROUTES (REQUIRE JWT) =====

    if (method === 'GET' && pathParts.length >= 3) {
      const operatorId = pathParts[2]

      if (operatorId) {
        const { data, error } = await supabaseWithAuth
          .from('operators')
          .select('*')
          .eq('id', operatorId)
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
      const { data, error } = await supabaseWithAuth
        .from('operators')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (method === 'POST') {
      const body = await req.json()

      const { data, error } = await supabaseWithAuth
        .from('operators')
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
      const operatorId = pathParts[2]
      const body = await req.json()

      const { data, error } = await supabaseWithAuth
        .from('operators')
        .update(body)
        .eq('id', operatorId)
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
      const operatorId = pathParts[2]

      const { error } = await supabaseWithAuth
        .from('operators')
        .delete()
        .eq('id', operatorId)

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
