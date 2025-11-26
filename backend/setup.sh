#!/bin/bash

# Evolution API Integration Setup Script

echo "🚀 SOL Logistics - Evolution API Setup"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Edit backend/.env and fill in:"
echo "   - SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard)"
echo "   - DATABASE_URL (from Supabase Database Settings)"
echo "   - GEMINI_API_KEY (from Google AI Studio)"
echo "   - EVOLUTION_API_URL (your Evolution API URL)"
echo "   - EVOLUTION_API_KEY (your Evolution API key)"
echo "   - INSTANCE_NAME (your WhatsApp instance name)"
echo ""
echo "2. Run the database migration:"
echo "   - Go to Supabase SQL Editor"
echo "   - Copy/paste backend/migrations/001_create_tables.sql"
echo "   - Execute the SQL"
echo ""
echo "3. Start the backend:"
echo "   docker-compose up --build"
echo ""
echo "4. Test the webhook:"
echo "   curl -X POST http://localhost:8000/api/v1/whatsapp/webhook \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"data\":{\"messageType\":\"conversation\",\"key\":{\"remoteJid\":\"5511999999999@s.whatsapp.net\"},\"message\":{\"conversation\":\"Olá\"}}}'"
echo ""
echo "5. Configure Evolution API webhook:"
echo "   - Point to: http://your-domain.com/api/v1/whatsapp/webhook"
echo "   - Or use ngrok for local testing"
echo ""
