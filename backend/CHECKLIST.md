# ✅ Checklist: Finalizar Configuração Evolution API

## Status Atual

### ✅ Já Configurado:
- ✅ Evolution API URL: `https://api.ampler.me`
- ✅ Evolution API Key: `52f13...acafb`
- ✅ Supabase URL: `https://lvmzrjkhogfhbbshwfgs.supabase.co`
- ✅ Supabase Anon Key: Configurado
- ✅ Instance Name: `sol_logistica`

### ❌ Faltam Configurar:

#### 1. SUPABASE_SERVICE_ROLE_KEY
**Onde pegar:**
1. Acesse: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/api
2. Procure por "service_role" (secret)
3. Copie a chave

**Como configurar:**
```bash
# Edite backend/.env e substitua:
SUPABASE_SERVICE_ROLE_KEY=sua-chave-aqui
```

#### 2. DATABASE_URL
**Onde pegar:**
1. Acesse: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/database
2. Procure por "Connection string" > "URI"
3. Copie a string (ela já vem com a senha)

**Como configurar:**
```bash
# Edite backend/.env e substitua:
# IMPORTANTE: Troque 'postgresql://' por 'postgresql+asyncpg://'
DATABASE_URL=postgresql+asyncpg://postgres:sua-senha@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres
```

#### 3. GEMINI_API_KEY
**Onde pegar:**
1. Acesse: https://aistudio.google.com/app/apikey
2. Crie uma nova API key (ou use uma existente)
3. Copie a chave

**Como configurar:**
```bash
# Edite backend/.env e substitua:
GEMINI_API_KEY=sua-chave-gemini-aqui
```

---

## Próximos Passos

### Passo 1: Rodar Migração SQL no Supabase

1. Acesse: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/sql/new
2. Copie TODO o conteúdo de: `backend/migrations/001_create_tables.sql`
3. Cole no SQL Editor
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Verifique se aparece "Migration completed successfully!"

### Passo 2: Iniciar o Backend

```bash
# Opção A: Com Docker (Recomendado)
docker-compose up --build

# Opção B: Sem Docker
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Passo 3: Testar o Backend

```bash
# Em outro terminal, rode:
./backend/test_webhook.sh
```

**Resultado esperado:**
```
✅ Backend is running
✅ Webhook processed greeting
✅ Webhook processed registration
✅ Admin config accessible
```

### Passo 4: Configurar Webhook na Evolution API

#### Opção A: Via API (Recomendado)

```bash
curl -X POST 'https://api.ampler.me/webhook/set/sol_logistica' \
  -H 'apikey: 52f13a23eee6e422dc718d4df667326c21168c2e7b2b777aa8d4b29c038acafb' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "SEU_BACKEND_URL/api/v1/whatsapp/webhook",
    "webhook_by_events": true,
    "events": ["messages.upsert"],
    "enabled": true
  }'
```

**Substitua `SEU_BACKEND_URL` por:**
- Local (com ngrok): `https://abc123.ngrok.io`
- Produção: `https://seu-dominio.com`

#### Opção B: Via Dashboard Evolution
1. Acesse o painel da Evolution API
2. Vá em Webhooks
3. Configure:
   - URL: `SEU_BACKEND_URL/api/v1/whatsapp/webhook`
   - Events: `messages.upsert`
   - Enabled: ✅

### Passo 5: Testar com WhatsApp Real

1. Envie mensagem para o WhatsApp conectado: **"Olá"**
2. Bot deve responder com menu de opções
3. Envie: **"Quero me cadastrar"**
4. Bot deve pedir seu nome
5. Continue o fluxo de cadastro

---

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se TODAS as variáveis do `.env` estão preenchidas
- Rode: `docker-compose logs -f api` para ver os erros

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correta
- Confirme que usou `postgresql+asyncpg://` (não `postgresql://`)
- Teste a conexão no Supabase Dashboard

### Webhook não recebe mensagens
- Verifique se o backend está acessível publicamente
- Use ngrok para testes locais: `ngrok http 8000`
- Confira os logs da Evolution API

### Bot não responde
- Verifique se `GEMINI_API_KEY` está válida
- Teste no Google AI Studio se a chave funciona
- Veja os logs do backend para erros

---

## 📞 Comandos Úteis

```bash
# Ver logs do backend
docker-compose logs -f api

# Parar backend
docker-compose down

# Reiniciar backend
docker-compose restart api

# Testar webhook
./backend/test_webhook.sh

# Ver configuração atual
cat backend/.env
```

---

## ✅ Quando Tudo Funcionar

Você terá:
- ✅ Backend rodando e conectado ao Supabase
- ✅ IA respondendo mensagens via WhatsApp
- ✅ Fluxo de cadastro de motoristas funcionando
- ✅ Busca de cargas por geolocalização
- ✅ RAG para responder dúvidas

**Próximos passos:**
- Adicionar mais intents (cancelar, status, etc.)
- Implementar suporte a localização GPS
- Adicionar botões interativos
- Treinar RAG com FAQs de logística
- Deploy em produção (EasyPanel, Railway, etc.)

---

**Precisa de ajuda?** Me avise quando tiver configurado as 3 credenciais faltantes! 🚀
