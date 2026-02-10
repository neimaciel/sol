#!/bin/bash

# Define variables - Projeto SOL (ekimcihxrnigghnappjv)
VITE_SUPABASE_URL="https://ekimcihxrnigghnappjv.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDEzNjgsImV4cCI6MjA4MjM3NzM2OH0.0Ig35iloZLzSUQnvmj9oVSQ2mYmSeWjpdaRudEU5qOo"
SUPABASE_URL="https://ekimcihxrnigghnappjv.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDEzNjgsImV4cCI6MjA4MjM3NzM2OH0.0Ig35iloZLzSUQnvmj9oVSQ2mYmSeWjpdaRudEU5qOo"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwMTM2OCwiZXhwIjoyMDgyMzc3MzY4fQ.krPxL5WPgrppk3qYn9lLD95QHA3dR29MalihbXv3kHY"
DATABASE_URL="postgresql+asyncpg://postgres:[YOUR_PASSWORD]@db.ekimcihxrnigghnappjv.supabase.co:5432/postgres"
GEMINI_API_KEY="AIzaSyC8NNyfxI-AQsuBn8lc4dH-magdQfWD6Tk"
EVOLUTION_API_URL="https://api.ampler.me"
EVOLUTION_API_KEY="52f13a23eee6e422dc718d4df667326c21168c2e7b2b777aa8d4b29c038acafb"
INSTANCE_NAME="sol_logistica"

# Function to add env var
add_env() {
    local key=$1
    local value=$2
    echo "Adding $key..."
    echo "$value" | vercel env add "$key" production || true
    echo "$value" | vercel env add "$key" preview || true
    echo "$value" | vercel env add "$key" development || true
}

echo "🚀 Configurando variáveis de ambiente na Vercel..."

# Frontend Variables
add_env "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
add_env "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"

# Backend Variables
add_env "SUPABASE_URL" "$SUPABASE_URL"
add_env "SUPABASE_KEY" "$SUPABASE_KEY"
add_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
add_env "DATABASE_URL" "$DATABASE_URL"
add_env "GEMINI_API_KEY" "$GEMINI_API_KEY"
add_env "EVOLUTION_API_URL" "$EVOLUTION_API_URL"
add_env "EVOLUTION_API_KEY" "$EVOLUTION_API_KEY"
add_env "INSTANCE_NAME" "$INSTANCE_NAME"

echo "✅ Todas as variáveis foram configuradas!"
echo "⚠️  IMPORTANTE: Você precisa fazer um novo deploy para que as alterações tenham efeito."
echo "👉 Rode: vercel --prod"
