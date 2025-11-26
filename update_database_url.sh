#!/bin/bash

# Script to update DATABASE_URL once user provides it

if [ -z "$1" ]; then
    echo "Usage: ./update_database_url.sh 'postgresql://postgres:PASSWORD@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres'"
    echo ""
    echo "Or just the password:"
    echo "./update_database_url.sh 'YOUR_PASSWORD'"
    exit 1
fi

DB_STRING="$1"

# Check if it's just a password or full connection string
if [[ $DB_STRING == postgresql* ]]; then
    # It's a full connection string, convert to asyncpg
    DB_URL=$(echo "$DB_STRING" | sed 's|postgresql://|postgresql+asyncpg://|')
else
    # It's just a password, build the full URL
    DB_URL="postgresql+asyncpg://postgres:${DB_STRING}@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres"
fi

# Update .env
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=${DB_URL}|" backend/.env

echo "✅ DATABASE_URL configured!"
echo ""
echo "Next steps:"
echo "1. Run SQL migration in Supabase"
echo "2. Start backend: docker-compose up --build"
echo "3. Test: ./backend/test_webhook.sh"
