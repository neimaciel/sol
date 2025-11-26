#!/bin/bash

# Update Evolution API credentials in backend/.env

echo "🔧 Updating Evolution API credentials..."

# Backup existing .env
cp backend/.env backend/.env.backup

# Update Evolution API settings
sed -i '' 's|EVOLUTION_API_URL=.*|EVOLUTION_API_URL=https://api.ampler.me|' backend/.env
sed -i '' 's|EVOLUTION_API_KEY=.*|EVOLUTION_API_KEY=52f13a23eee6e422dc718d4df667326c21168c2e7b2b777aa8d4b29c038acafb|' backend/.env

echo "✅ Evolution API credentials updated!"
echo ""
echo "⚠️  Ainda faltam configurar:"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - DATABASE_URL"
echo "  - GEMINI_API_KEY"
echo ""
echo "Você pode pegar essas credenciais em:"
echo "  - Supabase: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/api"
echo "  - Gemini: https://aistudio.google.com/app/apikey"
echo ""
