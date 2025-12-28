import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ekimcihxrnigghnappjv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwMTM2OCwiZXhwIjoyMDgyMzc3MzY4fQ.krPxL5WPgrppk3qYn9lLD95QHA3dR29MalihbXv3kHY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertLoad() {
  console.log('📝 Inserting load-example-1...');
  
  const { error } = await supabase
    .from('loads')
    .insert([
      {
        id: '880e8400-e29b-41d4-a716-446655440999',
        origin_city: 'São Paulo',
        origin_state: 'SP',
        destination_city: 'Rio de Janeiro',
        destination_state: 'RJ',
        cargo_type: 'Eletrônicos',
        cargo_weight: 15000.00,
        cargo_value: 500000.00,
        price: 8500.00,
        pickup_date: '2024-12-28',
        delivery_date: '2024-12-30',
        status: 'available',
        created_by: '550e8400-e29b-41d4-a716-446655440000'
      }
    ]);
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Load inserted! ID: 880e8400-e29b-41d4-a716-446655440999');
    console.log('🔗 Test URL: https://your-app.vercel.app/load/880e8400-e29b-41d4-a716-446655440999');
  }
}

insertLoad();