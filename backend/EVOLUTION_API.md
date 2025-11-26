# Evolution API Integration Guide

## 📱 Evolution API Setup

### 1. Prerequisites

- Evolution API v2 instance running
- WhatsApp number connected to Evolution API
- API Key from your Evolution instance

### 2. Configure Webhook

#### Option A: Using Evolution API Dashboard

1. Access your Evolution API dashboard
2. Go to **Webhooks** section
3. Add a new webhook with:
   - **URL**: `https://your-backend-domain.com/api/v1/whatsapp/webhook`
   - **Events**: Select `messages.upsert` (incoming messages)
   - **Enabled**: ✅

#### Option B: Using API Call

```bash
curl -X POST 'https://your-evolution-api.com/webhook/set/{instance}' \
  -H 'apikey: YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://your-backend-domain.com/api/v1/whatsapp/webhook",
    "webhook_by_events": true,
    "events": [
      "messages.upsert"
    ],
    "enabled": true
  }'
```

### 3. Test Webhook Connection

#### Test 1: Send a Test Message

1. Send a WhatsApp message to your connected number
2. Check backend logs for incoming webhook:
   ```bash
   docker-compose logs -f api
   ```
3. Look for: `Received message from {phone}: {message}`

#### Test 2: Manual Webhook Test

```bash
# Simulate Evolution API webhook
curl -X POST 'http://localhost:8000/api/v1/whatsapp/webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "messageType": "conversation",
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net"
      },
      "message": {
        "conversation": "Olá"
      }
    }
  }'
```

Expected response:
```json
{"status": "processed"}
```

### 4. Verify Full Flow

#### Registration Flow Test

1. **User sends**: "Quero me cadastrar"
   - Expected: Bot asks for name

2. **User sends**: "João Silva"
   - Expected: Bot asks for vehicle type

3. **User sends**: "Caminhão"
   - Expected: Bot confirms registration

4. **Verify in database**:
   ```sql
   SELECT * FROM drivers WHERE phone = '5511999999999@s.whatsapp.net';
   SELECT * FROM vehicles WHERE driver_id = '5511999999999@s.whatsapp.net';
   ```

#### Freight Search Flow Test

1. **User sends**: "Buscar cargas"
   - Expected: Bot asks for location

2. **User shares location** (or sends city name)
   - Expected: Bot shows available loads nearby

### 5. Evolution API Message Types

The webhook handles these message types:

- `conversation`: Regular text messages
- `extendedTextMessage`: Replies, forwarded messages
- `locationMessage`: Location sharing (future implementation)

### 6. Troubleshooting

#### Webhook Not Receiving Messages

1. **Check Evolution API logs**:
   ```bash
   # In your Evolution API instance
   docker logs evolution-api
   ```

2. **Verify webhook is registered**:
   ```bash
   curl -X GET 'https://your-evolution-api.com/webhook/find/{instance}' \
     -H 'apikey: YOUR_API_KEY'
   ```

3. **Test backend is accessible**:
   ```bash
   curl http://localhost:8000/health
   ```

#### Messages Received but No Response

1. **Check backend logs** for errors:
   ```bash
   docker-compose logs -f api | grep ERROR
   ```

2. **Verify AI service** is working:
   - Check `GEMINI_API_KEY` is valid
   - Test intent analysis manually

3. **Check WhatsApp service** configuration:
   - Verify `EVOLUTION_API_URL` is correct
   - Verify `INSTANCE_NAME` matches your instance

#### Database Connection Issues

1. **Test database connection**:
   ```bash
   # From backend directory
   python3 -c "from core.database import engine; import asyncio; asyncio.run(engine.connect())"
   ```

2. **Check Supabase** is accessible:
   - Verify IP is whitelisted
   - Check connection string format

### 7. Production Deployment

#### Using ngrok (Development/Testing)

```bash
# Expose local backend
ngrok http 8000

# Update webhook URL to ngrok URL
# Example: https://abc123.ngrok.io/api/v1/whatsapp/webhook
```

#### Using EasyPanel (Production)

1. Deploy backend to EasyPanel
2. Get your public URL (e.g., `https://sol-backend.easypanel.host`)
3. Update Evolution API webhook to: `https://sol-backend.easypanel.host/api/v1/whatsapp/webhook`
4. Ensure SSL/HTTPS is enabled

### 8. Security Considerations

- ✅ Use HTTPS in production (Evolution API requires it)
- ✅ Validate webhook signatures (if Evolution API provides them)
- ✅ Rate limit webhook endpoint
- ✅ Log all incoming messages for debugging
- ✅ Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend

### 9. Monitoring

#### Key Metrics to Track

- Webhook response time
- Message processing success rate
- AI intent detection accuracy
- Database query performance

#### Logs to Monitor

```bash
# All backend logs
docker-compose logs -f api

# Only webhook activity
docker-compose logs -f api | grep "Received message"

# Only errors
docker-compose logs -f api | grep ERROR
```

### 10. Next Steps

After successful integration:

1. ✅ Test all conversation flows
2. ✅ Add more intents (e.g., "Check load status", "Cancel registration")
3. ✅ Implement location message handling
4. ✅ Add interactive buttons/lists (Evolution API supports them)
5. ✅ Set up monitoring and alerts
6. ✅ Train RAG with logistics FAQs

## 📞 Support

If you encounter issues:
1. Check Evolution API documentation: https://doc.evolution-api.com
2. Review backend logs
3. Test each component separately (DB, AI, WhatsApp)
