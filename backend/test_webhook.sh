#!/bin/bash

# Test Evolution API Webhook Integration

echo "🧪 Testing Evolution API Webhook"
echo "================================="
echo ""

# Colors
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
response=$(curl -s http://localhost:8000/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "Response: $response"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "Please start the backend first: docker-compose up"
    exit 1
fi

echo ""

# Test 2: Webhook - Greeting
echo "Test 2: Webhook - Greeting Intent"
echo "----------------------------------"
response=$(curl -s -X POST http://localhost:8000/api/v1/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "messageType": "conversation",
      "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
      "message": {"conversation": "Olá"}
    }
  }')

if echo "$response" | grep -q "processed"; then
    echo -e "${GREEN}✅ Webhook processed greeting${NC}"
    echo "Response: $response"
else
    echo -e "${RED}❌ Webhook failed${NC}"
    echo "Response: $response"
fi

echo ""

# Test 3: Webhook - Registration Intent
echo "Test 3: Webhook - Registration Intent"
echo "--------------------------------------"
response=$(curl -s -X POST http://localhost:8000/api/v1/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "messageType": "conversation",
      "key": {"remoteJid": "5511888888888@s.whatsapp.net"},
      "message": {"conversation": "Quero me cadastrar"}
    }
  }')

if echo "$response" | grep -q "processed"; then
    echo -e "${GREEN}✅ Webhook processed registration${NC}"
    echo "Response: $response"
else
    echo -e "${RED}❌ Webhook failed${NC}"
    echo "Response: $response"
fi

echo ""

# Test 4: Admin Config
echo "Test 4: Admin Config Endpoint"
echo "------------------------------"
response=$(curl -s http://localhost:8000/api/v1/admin/config)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Admin config accessible${NC}"
    echo "Response: $response"
else
    echo -e "${RED}❌ Admin config failed${NC}"
fi

echo ""
echo "================================="
echo -e "${YELLOW}📋 Summary:${NC}"
echo "- Backend is running on http://localhost:8000"
echo "- Webhook endpoint: http://localhost:8000/api/v1/whatsapp/webhook"
echo "- API docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure Evolution API webhook to point to your backend"
echo "2. Send a real WhatsApp message to test"
echo "3. Check logs: docker-compose logs -f api"
echo ""
