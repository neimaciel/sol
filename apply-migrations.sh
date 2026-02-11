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

# Configurações
SUPABASE_URL="https://ekimcihxrnigghnappjv.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW1jaWh4cm5pZ2dobmFwcGp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgwMTM2OCwiZXhwIjoyMDgyMzc3MzY4fQ.krPxL5WPgrppk3qYn9lLD95QHA3dR29MalihbXv3kHY"

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
