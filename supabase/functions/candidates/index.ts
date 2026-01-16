import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  const method = req.method
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(p => p)

  console.log(`🎯 [CANDIDATES] ${method} ${url.pathname}`)

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with auth from request
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization')

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    })

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ [CANDIDATES] Auth error:', authError)
      return new Response(
        JSON.stringify({ code: 401, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [CANDIDATES] Authenticated user:', user.id)

    // ===================================
    // GET /candidates/by-load/{loadId}
    // ===================================
    if (method === 'GET' && pathParts.length >= 3 && pathParts[1] === 'by-load') {
      const loadId = pathParts[2]
      console.log('🔍 [CANDIDATES] Fetching candidates for load:', loadId)

      const { data: candidates, error } = await supabase
        .from('candidates')
        .select(`
          id,
          load_id,
          driver_id,
          status,
          proposed_price,
          notes,
          created_at,
          updated_at,
          drivers:driver_id (
            id,
            name,
            phone,
            cpf_cnpj,
            vehicle_type,
            vehicle_plate
          )
        `)
        .eq('load_id', loadId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ [CANDIDATES] Error fetching candidates:', error)
        return new Response(
          JSON.stringify({ code: 500, message: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Transform to match frontend expectations
      const transformedCandidates = (candidates || []).map((c: any) => ({
        id: c.id,
        load_id: c.load_id,
        driver_id: c.driver_id,
        status: c.status,
        proposed_price: c.proposed_price,
        notes: c.notes,
        created_at: c.created_at,
        updated_at: c.updated_at,
        driver: c.drivers || {},
        chat_messages: [] // TODO: implement chat messages
      }))

      console.log(`✅ [CANDIDATES] Found ${transformedCandidates.length} candidates`)
      return new Response(
        JSON.stringify(transformedCandidates),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // POST /candidates/{candidateId}/select
    // ===================================
    if (method === 'POST' && pathParts.length >= 3 && pathParts[2] === 'select') {
      const candidateId = pathParts[1]
      console.log('✅ [CANDIDATES] Selecting candidate:', candidateId)

      // Get the candidate to find the load_id
      const { data: candidate, error: fetchError } = await supabase
        .from('candidates')
        .select('load_id')
        .eq('id', candidateId)
        .single()

      if (fetchError || !candidate) {
        console.error('❌ [CANDIDATES] Candidate not found:', fetchError)
        return new Response(
          JSON.stringify({ code: 404, message: 'Candidate not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const loadId = candidate.load_id

      // Update selected candidate to 'selected'
      const { error: updateSelectedError } = await supabase
        .from('candidates')
        .update({ status: 'selected', updated_at: new Date().toISOString() })
        .eq('id', candidateId)

      if (updateSelectedError) {
        console.error('❌ [CANDIDATES] Error updating selected candidate:', updateSelectedError)
        return new Response(
          JSON.stringify({ code: 500, message: updateSelectedError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Reject all other candidates for this load
      const { error: rejectOthersError } = await supabase
        .from('candidates')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('load_id', loadId)
        .neq('id', candidateId)
        .in('status', ['pending', 'negotiating'])

      if (rejectOthersError) {
        console.error('❌ [CANDIDATES] Error rejecting other candidates:', rejectOthersError)
        // Don't fail the request, just log the error
      }

      console.log('✅ [CANDIDATES] Candidate selected successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Candidate selected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // POST /candidates - Create new candidate
    // ===================================
    if (method === 'POST' && pathParts.length === 1) {
      console.log('➕ [CANDIDATES] Creating new candidate')
      const body = await req.json()

      const { data, error } = await supabase
        .from('candidates')
        .insert({
          load_id: body.load_id,
          driver_id: body.driver_id,
          status: body.status || 'pending',
          proposed_price: body.proposed_price || null,
          notes: body.notes || null,
        })
        .select(`
          id,
          load_id,
          driver_id,
          status,
          proposed_price,
          notes,
          created_at,
          updated_at,
          drivers:driver_id (
            id,
            name,
            phone,
            cpf_cnpj,
            vehicle_type,
            vehicle_plate
          )
        `)
        .single()

      if (error) {
        console.error('❌ [CANDIDATES] Error creating candidate:', error)
        return new Response(
          JSON.stringify({ code: 500, message: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [CANDIDATES] Candidate created:', data.id)
      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // GET /candidates/{id}
    // ===================================
    if (method === 'GET' && pathParts.length >= 2 && pathParts[1] !== 'by-load') {
      const candidateId = pathParts[1]
      console.log('🔍 [CANDIDATES] Fetching candidate:', candidateId)

      const { data, error } = await supabase
        .from('candidates')
        .select(`
          id,
          load_id,
          driver_id,
          status,
          proposed_price,
          notes,
          created_at,
          updated_at,
          drivers:driver_id (
            id,
            name,
            phone,
            cpf_cnpj,
            vehicle_type,
            vehicle_plate
          )
        `)
        .eq('id', candidateId)
        .single()

      if (error) {
        console.error('❌ [CANDIDATES] Error fetching candidate:', error)
        return new Response(
          JSON.stringify({ code: 404, message: 'Candidate not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [CANDIDATES] Candidate found:', data.id)
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // PUT /candidates/{id}
    // ===================================
    if (method === 'PUT' && pathParts.length >= 2) {
      const candidateId = pathParts[1]
      console.log('🔄 [CANDIDATES] Updating candidate:', candidateId)
      const body = await req.json()

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (body.status !== undefined) updateData.status = body.status
      if (body.proposed_price !== undefined) updateData.proposed_price = body.proposed_price
      if (body.notes !== undefined) updateData.notes = body.notes

      const { data, error } = await supabase
        .from('candidates')
        .update(updateData)
        .eq('id', candidateId)
        .select()
        .single()

      if (error) {
        console.error('❌ [CANDIDATES] Error updating candidate:', error)
        return new Response(
          JSON.stringify({ code: 500, message: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [CANDIDATES] Candidate updated:', data.id)
      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // DELETE /candidates/{id}
    // ===================================
    if (method === 'DELETE' && pathParts.length >= 2) {
      const candidateId = pathParts[1]
      console.log('🗑️ [CANDIDATES] Deleting candidate:', candidateId)

      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId)

      if (error) {
        console.error('❌ [CANDIDATES] Error deleting candidate:', error)
        return new Response(
          JSON.stringify({ code: 500, message: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [CANDIDATES] Candidate deleted')
      return new Response(
        JSON.stringify({ success: true, message: 'Candidate deleted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // Route not found
    // ===================================
    console.warn('⚠️ [CANDIDATES] Route not found:', method, url.pathname)
    return new Response(
      JSON.stringify({ code: 404, message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [CANDIDATES] Unexpected error:', error)
    return new Response(
      JSON.stringify({ code: 500, message: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
