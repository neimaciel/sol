#!/bin/bash

# Test script for extracting WhatsApp Group JID from invite link

API_URL="http://localhost:8000/api/v1/whatsapp/extract-group-jid"

# Example invite link - replace with your actual group invite link
INVITE_LINK="https://chat.whatsapp.com/YOUR_INVITE_CODE_HERE"

echo "🔍 Testing Group JID Extraction..."
echo "API Endpoint: $API_URL"
echo "Invite Link: $INVITE_LINK"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"invite_link\": \"$INVITE_LINK\"}" \
  | json_pp

echo ""
echo "✅ Test complete!"
