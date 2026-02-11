#!/bin/bash

# Load environment variables from .env.local or .env.production
if [ -f ".env.local" ]; then
    echo "📄 Carregando variáveis de .env.local"
    export $(grep -v '^#' .env.local | xargs)
elif [ -f ".env.production" ]; then
    echo "📄 Carregando variáveis de .env.production"
    export $(grep -v '^#' .env.production | xargs)
else
    echo "❌ Erro: Nenhum arquivo .env.local ou .env.production encontrado"
    echo ""
    echo "Crie um arquivo .env.local com as seguintes variáveis:"
    echo "  VITE_SUPABASE_URL=..."
    echo "  VITE_SUPABASE_ANON_KEY=..."
    echo "  SUPABASE_SERVICE_ROLE_KEY=..."
    echo "  GEMINI_API_KEY=..."
    echo "  EVOLUTION_API_URL=..."
    echo "  EVOLUTION_API_KEY=..."
    echo "  INSTANCE_NAME=..."
    echo "  DATABASE_URL=..."
    exit 1
fi

# Read variables from environment (set by export above or by user)
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}"
SUPABASE_URL="${SUPABASE_URL:-$VITE_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_KEY:-$VITE_SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
DATABASE_URL="${DATABASE_URL:-}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
EVOLUTION_API_URL="${EVOLUTION_API_URL:-}"
EVOLUTION_API_KEY="${EVOLUTION_API_KEY:-}"
INSTANCE_NAME="${INSTANCE_NAME:-sol_logistica}"

# Validate required variables
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Erro: Variáveis obrigatórias não definidas"
    echo "Certifique-se de que .env.local contém:"
    echo "  VITE_SUPABASE_URL"
    echo "  VITE_SUPABASE_ANON_KEY"
    exit 1
fi

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
