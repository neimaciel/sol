#!/bin/bash

# Script para aplicar migrations no Supabase
# Uso: bash apply-migrations.sh

set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Aplicando Migrations no Supabase${NC}\n"

# Configurações - Load from environment variables
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"

# Validate required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_KEY"
    echo ""
    echo "Usage:"
    echo "  export SUPABASE_URL='your-supabase-url'"
    echo "  export SUPABASE_SERVICE_KEY='your-service-role-key'"
    echo "  bash apply-migrations.sh"
    echo ""
    exit 1
fi

# Função para executar SQL
execute_sql() {
    local file=$1
    local name=$2

    echo -e "${YELLOW}📄 Aplicando: $name${NC}"

    local sql=$(cat "$file")

    local response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql" | jq -Rs .)}")

    if echo "$response" | grep -q "error"; then
        echo -e "${RED}❌ Erro ao aplicar $name${NC}"
        echo "$response" | jq '.'
        return 1
    else
        echo -e "${GREEN}✅ $name aplicado com sucesso${NC}\n"
        return 0
    fi
}

# Lista de migrations para aplicar
migrations=(
    "supabase/migrations/20260210150000_add_missing_loads_columns.sql|Colunas Faltantes em Loads"
    "supabase/migrations/20260210150100_fix_payments_schema.sql|Schema Payments Completo"
    "supabase/migrations/20260210140000_fix_rls_policies.sql|Corrigir Políticas RLS (P21)"
)

# Aplicar cada migration
success_count=0
total_count=${#migrations[@]}

for migration in "${migrations[@]}"; do
    IFS='|' read -r file name <<< "$migration"

    if [ -f "$file" ]; then
        if execute_sql "$file" "$name"; then
            ((success_count++))
        fi
    else
        echo -e "${RED}❌ Arquivo não encontrado: $file${NC}"
    fi
done

# Resumo
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}📊 Resumo${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "Total de migrations: $total_count"
echo -e "Sucesso: ${GREEN}$success_count${NC}"
echo -e "Falhas: ${RED}$((total_count - success_count))${NC}"

if [ $success_count -eq $total_count ]; then
    echo -e "\n${GREEN}🎉 Todas as migrations foram aplicadas com sucesso!${NC}\n"

    echo -e "${YELLOW}📋 Próximos Passos:${NC}"
    echo -e "1. Verifique as tabelas no Supabase Dashboard"
    echo -e "2. Teste o auto-advance workflow"
    echo -e "3. Teste o sistema de pagamentos"
    echo -e "4. Execute: npm run build && git add . && git commit"
    echo ""
    exit 0
else
    echo -e "\n${RED}⚠️ Algumas migrations falharam. Verifique os erros acima.${NC}\n"
    exit 1
fi
