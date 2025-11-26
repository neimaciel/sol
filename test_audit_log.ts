// Test script to verify card_events table and logging
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuditLog() {
    console.log('Testing card_events table...')

    // Test 1: Check if table exists
    console.log('\n1. Checking if card_events table exists...')
    const { data: tables, error: tablesError } = await supabase
        .from('card_events')
        .select('*')
        .limit(1)

    if (tablesError) {
        console.error('❌ Table does not exist or has RLS issues:', tablesError.message)
        return
    }

    console.log('✅ card_events table exists!')

    // Test 2: Try to insert a test event
    console.log('\n2. Attempting to insert a test event...')
    const { data: insertData, error: insertError } = await supabase
        .from('card_events')
        .insert([{
            card_id: 'TEST-0001',
            action: 'test',
            details: { test: true }
        }])
        .select()

    if (insertError) {
        console.error('❌ Insert failed:', insertError.message)
    } else {
        console.log('✅ Event inserted successfully:', insertData)
    }

    // Test 3: Fetch all events
    console.log('\n3. Fetching all events...')
    const { data: allEvents, error: fetchError } = await supabase
        .from('card_events')
        .select('*')
        .order('created_at', { ascending: false })

    if (fetchError) {
        console.error('❌ Fetch failed:', fetchError.message)
    } else {
        console.log(`✅ Found ${allEvents?.length || 0} events`)
        console.log(allEvents)
    }
}

testAuditLog().then(() => console.log('\nTest complete!')).catch(console.error)
