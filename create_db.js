import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDatabase() {
  console.log('🚀 Setting up SOL Logistics database...');
  
  try {
    console.log('✅ Connected to Supabase!');
    
    // The tables should be created manually via SQL Editor
    // Let's try to insert data to check if tables exist
    
    // Insert operators
    console.log('📝 Inserting operators...');
    const { error: operatorError } = await supabase
      .from('operators')
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Admin SOL',
          email: 'admin@sollogistica.com',
          role: 'admin'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Maria Silva',
          email: 'maria@sollogistica.com',
          role: 'operator'
        }
      ]);
    
    if (operatorError) {
      console.log('❌ Operators error:', operatorError.message);
      console.log('📋 Please create tables manually in SQL Editor first!');
      return;
    }
    console.log('✅ Operators inserted!');
    
    // Insert drivers
    console.log('📝 Inserting drivers...');
    const { error: driverError } = await supabase
      .from('drivers')
      .insert([
        {
          id: '660e8400-e29b-41d4-a716-446655440000',
          name: 'João Santos',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          license_number: 'ABC123456',
          vehicle_type: 'Carreta',
          vehicle_plate: 'ABC-1234'
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '(11) 88888-8888',
          license_number: 'DEF789012',
          vehicle_type: 'Truck',
          vehicle_plate: 'DEF-5678'
        }
      ]);
    
    if (driverError) {
      console.log('❌ Drivers error:', driverError.message);
      return;
    }
    console.log('✅ Drivers inserted!');
    
    // Insert groups
    console.log('📝 Inserting groups...');
    const { error: groupError } = await supabase
      .from('groups')
      .insert([
        {
          id: '770e8400-e29b-41d4-a716-446655440000',
          name: 'Motoristas SP',
          whatsapp_id: '5511999999999-1234567890@g.us',
          description: 'Grupo de motoristas de São Paulo'
        },
        {
          id: '770e8400-e29b-41d4-a716-446655440001',
          name: 'Carreteiros RJ',
          whatsapp_id: '5521888888888-0987654321@g.us',
          description: 'Grupo de carreteiros do Rio de Janeiro'
        }
      ]);
    
    if (groupError) {
      console.log('❌ Groups error:', groupError.message);
      return;
    }
    console.log('✅ Groups inserted!');
    
    // Insert loads
    console.log('📝 Inserting loads...');
    const { error: loadError } = await supabase
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
    
    if (loadError) {
      console.log('❌ Loads error:', loadError.message);
      return;
    }
    console.log('✅ Loads inserted!');
    
    console.log('🎉 Database setup complete!');
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

createDatabase();