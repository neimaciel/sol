#!/bin/bash

# Final configuration update with all credentials

echo "🔧 Updating all credentials in backend/.env..."

# Update Gemini API Key
sed -i '' 's|GEMINI_API_KEY=.*|GEMINI_API_KEY=AIzaSyC8NNyfxI-AQsuBn8lc4dH-magdQfWD6Tk|' backend/.env

# Update Supabase Service Role Key
sed -i '' 's|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2bXpyamtob2dmaGJic2h3ZmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAxNjg4NCwiZXhwIjoyMDYxNTkyODg0fQ.NwbKBMVSRviqewEj7wfQ8rjFNPG-vzbS-I9SK8R3bTU|' backend/.env

# Update Database URL (need to get password from Supabase)
# For now, using a placeholder - user will need to fill this manually
echo ""
echo "✅ Gemini API Key configured!"
echo "✅ Supabase Service Role Key configured!"
echo ""
echo "⚠️  DATABASE_URL ainda precisa ser configurado manualmente:"
echo "   1. Acesse: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/database"
echo "   2. Copie a 'Connection string' (URI)"
echo "   3. Substitua 'postgresql://' por 'postgresql+asyncpg://'"
echo "   4. Cole no backend/.env na linha DATABASE_URL"
echo ""
echo "Ou use este formato:"
echo "DATABASE_URL=postgresql+asyncpg://postgres:[SUA_SENHA]@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres"
echo ""
