import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

serve(async (req) => {
  const method = req.method
  const url = new URL(req.url)
  const pathParts = url.pathname.split('/').filter(p => p)

  console.log(`📁 [FILES] ${method} ${url.pathname}`)

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
      console.error('❌ [FILES] Auth error:', authError)
      return new Response(
        JSON.stringify({ code: 401, message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [FILES] Authenticated user:', user.id)

    // ===================================
    // POST /files/upload - Upload file
    // ===================================
    if (method === 'POST' && pathParts.length >= 2 && pathParts[1] === 'upload') {
      console.log('📤 [FILES] Uploading file')

      const formData = await req.formData()
      const file = formData.get('file') as File
      const path = formData.get('path') as string || 'uploads'

      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${path}/${fileName}`

      console.log('📝 [FILES] Uploading to:', filePath)

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const fileData = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('files') // Make sure this bucket exists in Supabase Storage
        .upload(filePath, fileData, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error('❌ [FILES] Upload error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath)

      console.log('✅ [FILES] File uploaded:', filePath)
      return new Response(
        JSON.stringify({
          success: true,
          file: {
            path: data.path,
            url: publicUrl,
            name: file.name,
            size: file.size,
            type: file.type
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // GET /files/{bucket}/{path} - Get file URL
    // ===================================
    if (method === 'GET' && pathParts.length >= 3) {
      const bucket = pathParts[1]
      const filePath = pathParts.slice(2).join('/')

      console.log('🔍 [FILES] Getting file URL:', bucket, filePath)

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)

      return new Response(
        JSON.stringify({ url: publicUrl }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // DELETE /files/{bucket}/{path} - Delete file
    // ===================================
    if (method === 'DELETE' && pathParts.length >= 3) {
      const bucket = pathParts[1]
      const filePath = pathParts.slice(2).join('/')

      console.log('🗑️ [FILES] Deleting file:', bucket, filePath)

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('❌ [FILES] Delete error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ [FILES] File deleted')
      return new Response(
        JSON.stringify({ success: true, message: 'File deleted' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===================================
    // Route not found
    // ===================================
    console.warn('⚠️ [FILES] Route not found:', method, url.pathname)
    return new Response(
      JSON.stringify({ code: 404, message: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ [FILES] Unexpected error:', error)
    return new Response(
      JSON.stringify({ code: 500, message: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
