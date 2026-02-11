#!/bin/bash

# Script para adicionar variáveis de ambiente no Vercel via API
# Uso: VERCEL_TOKEN="seu_token_aqui" bash add-vercel-env.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Configurando Variáveis de Ambiente no Vercel${NC}\n"

# Verificar se o token foi fornecido
if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ Erro: VERCEL_TOKEN não definido${NC}"
    echo ""
    echo "Como usar:"
    echo "1. Obtenha seu token em: https://vercel.com/account/tokens"
    echo "2. Execute: VERCEL_TOKEN=\"seu_token\" bash add-vercel-env.sh"
    exit 1
fi

# Configurações do projeto
PROJECT_NAME="sol"
TEAM_ID="" # Deixe vazio se for conta pessoal

# Variáveis de ambiente
VITE_SUPABASE_URL="https://ekimcihxrnigghnappjv.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MDEzNjgsImV4cCI6MjA4MjM3NzM2OH0.0Ig35iloZLzSUQnvmj9oVSQ2mYmSeWjpdaRudEU5qOo"

# Função para adicionar variável de ambiente
add_env_var() {
    local key=$1
    local value=$2
    local target=$3 # production, preview, development

    echo -e "${YELLOW}📝 Adicionando $key para $target...${NC}"

    local url="https://api.vercel.com/v10/projects/$PROJECT_NAME/env"
    if [ -n "$TEAM_ID" ]; then
        url="$url?teamId=$TEAM_ID"
    fi

    local response=$(curl -s -X POST "$url" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"key\": \"$key\",
            \"value\": \"$value\",
            \"type\": \"encrypted\",
            \"target\": [\"$target\"]
        }")

    if echo "$response" | grep -q "error"; then
        echo -e "${RED}  ❌ Erro: $(echo $response | grep -o '"message":"[^"]*"')${NC}"
        return 1
    else
        echo -e "${GREEN}  ✅ Adicionado com sucesso${NC}"
        return 0
    fi
}

# Buscar ID do projeto
echo -e "${YELLOW}🔍 Buscando projeto '$PROJECT_NAME'...${NC}"
PROJECT_URL="https://api.vercel.com/v9/projects/$PROJECT_NAME"
if [ -n "$TEAM_ID" ]; then
    PROJECT_URL="$PROJECT_URL?teamId=$TEAM_ID"
fi

PROJECT_INFO=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$PROJECT_URL")

if echo "$PROJECT_INFO" | grep -q "error"; then
    echo -e "${RED}❌ Projeto não encontrado ou token inválido${NC}"
    echo "$PROJECT_INFO"
    exit 1
fi

echo -e "${GREEN}✅ Projeto encontrado!${NC}\n"

# Adicionar variáveis para cada ambiente
for target in production preview development; do
    echo -e "\n${YELLOW}═══ Configurando $target ═══${NC}"
    add_env_var "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL" "$target"
    add_env_var "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY" "$target"
done

echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Variáveis configuradas com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${YELLOW}⚠️  PRÓXIMO PASSO:${NC}"
echo -e "Faça um redeploy no Vercel para aplicar as variáveis:"
echo -e "  1. Acesse: https://vercel.com/neimaciel/sol"
echo -e "  2. Vá em Deployments"
echo -e "  3. Clique em '...' → Redeploy"
echo -e "  4. Desmarque 'Use existing Build Cache'\n"

echo -e "${YELLOW}Ou execute:${NC}"
echo -e "  npx vercel --prod --force\n"
