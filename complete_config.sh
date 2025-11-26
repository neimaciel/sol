#!/bin/bash

# Complete backend/.env configuration with all credentials

echo "🔧 Completing backend configuration..."

# Update Supabase credentials (from frontend .env)
sed -i '' 's|SUPABASE_URL=.*|SUPABASE_URL=https://lvmzrjkhogfhbbshwfgs.supabase.co|' backend/.env
sed -i '' 's|SUPABASE_KEY=.*|SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXpyamtob2dmaGJic2h3ZmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMTY4ODQsImV4cCI6MjA2MTU5Mjg4NH0.116ffAVNT4R1ZHYcdZSg0azSuKsQFkNtspOwzzfbS88|' backend/.env

echo "✅ Supabase URL and ANON_KEY configured!"
echo ""
echo "⚠️  Ainda faltam (você precisa fornecer):"
echo "  1. SUPABASE_SERVICE_ROLE_KEY - Pegue em: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/api"
echo "  2. DATABASE_URL - Pegue em: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/database"
echo "  3. GEMINI_API_KEY - Pegue em: https://aistudio.google.com/app/apikey"
echo ""
echo "Depois de preencher, rode:"
echo "  docker-compose up --build"
echo ""
