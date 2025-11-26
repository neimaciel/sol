# 🚀 Guia Rápido: Conectar Evolution API

## Passo 1: Configurar Credenciais

Edite o arquivo `backend/.env` e preencha:

```bash
# Abra o arquivo
code backend/.env  # ou use seu editor preferido
```

### Credenciais Necessárias:

#### 1. **Supabase** (já preenchido parcialmente)
- ✅ `SUPABASE_URL` - Já configurado
- ✅ `SUPABASE_KEY` - Já configurado
- ❌ `SUPABASE_SERVICE_ROLE_KEY` - Pegue em: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/api
- ❌ `DATABASE_URL` - Pegue em: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/settings/database
  - Formato: `postgresql+asyncpg://postgres:[SUA_SENHA]@db.lvmzrjkhogfhbbshwfgs.supabase.co:5432/postgres`

#### 2. **Google Gemini AI**
- ❌ `GEMINI_API_KEY` - Pegue em: https://aistudio.google.com/app/apikey

#### 3. **Evolution API** (VOCÊ PRECISA FORNECER)
- ❌ `EVOLUTION_API_URL` - Ex: `https://api.evolution.com.br`
- ❌ `EVOLUTION_API_KEY` - Sua chave de API
- ❌ `INSTANCE_NAME` - Nome da sua instância WhatsApp (ex: `sol_logistica`)

---

## Passo 2: Criar Tabelas no Supabase

1. Acesse: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/sql/new
2. Copie o conteúdo de `backend/migrations/001_create_tables.sql`
3. Cole no SQL Editor
4. Clique em **Run**

---

## Passo 3: Testar Backend Localmente

```bash
# Opção A: Com Docker (Recomendado)
docker-compose up --build

# Opção B: Sem Docker
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Acesse: http://localhost:8000/docs para ver a documentação da API

---

## Passo 4: Testar Webhook Localmente

```bash
# Teste simples
curl -X POST http://localhost:8000/api/v1/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "messageType": "conversation",
      "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
      "message": {"conversation": "Olá"}
    }
  }'
```

**Resposta esperada**: `{"status":"processed"}`

---

## Passo 5: Expor Backend para Internet (Teste)

### Opção A: Usando ngrok (Desenvolvimento)

```bash
# Instale ngrok: https://ngrok.com/download
ngrok http 8000
```

Você receberá uma URL tipo: `https://abc123.ngrok.io`

### Opção B: Deploy em Produção (EasyPanel, Vercel, etc.)

Configure seu serviço de deploy apontando para a pasta `backend/`

---

## Passo 6: Configurar Webhook na Evolution API

### Via Dashboard Evolution:
1. Acesse seu painel Evolution API
2. Vá em **Webhooks**
3. Configure:
   - **URL**: `https://sua-url.com/api/v1/whatsapp/webhook`
   - **Events**: `messages.upsert`
   - **Enabled**: ✅

### Via API (cURL):

```bash
curl -X POST 'https://SEU_EVOLUTION_API/webhook/set/SEU_INSTANCE' \
  -H 'apikey: SUA_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://sua-url.com/api/v1/whatsapp/webhook",
    "webhook_by_events": true,
    "events": ["messages.upsert"],
    "enabled": true
  }'
```

---

## Passo 7: Testar Fluxo Completo

1. Envie uma mensagem para o WhatsApp conectado: **"Quero me cadastrar"**
2. O bot deve responder: **"Qual é o seu nome completo?"**
3. Responda com um nome: **"João Silva"**
4. O bot deve perguntar: **"Qual é o tipo do seu veículo?"**
5. Responda: **"Caminhão"**
6. O bot deve confirmar: **"Cadastro realizado com sucesso! 🚀"**

---

## 🐛 Troubleshooting

### Backend não inicia
- Verifique se todas as variáveis do `.env` estão preenchidas
- Confira os logs: `docker-compose logs -f api`

### Webhook não recebe mensagens
- Verifique se a URL está acessível publicamente
- Teste com `curl` primeiro
- Confira logs da Evolution API

### Bot não responde
- Verifique `GEMINI_API_KEY` está válida
- Confira logs do backend
- Teste o endpoint `/health`

---

## 📞 Próximos Passos

Depois que tudo funcionar:
1. ✅ Adicionar mais intents (buscar carga, cancelar, etc.)
2. ✅ Implementar suporte a localização (GPS)
3. ✅ Adicionar botões interativos
4. ✅ Treinar RAG com FAQs de logística
5. ✅ Configurar monitoramento e alertas

---

**Precisa de ajuda?** Revise:
- `backend/README.md` - Setup completo
- `backend/EVOLUTION_API.md` - Guia detalhado Evolution API
