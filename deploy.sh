#!/bin/bash

echo "🚀 Iniciando deploy para Vercel..."
echo ""

# Verificar se o build está atualizado
echo "📦 Verificando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "🌐 Fazendo deploy para produção..."
    npx vercel --prod --yes
else
    echo "❌ Erro no build. Corrija os erros antes de fazer deploy."
    exit 1
fi
