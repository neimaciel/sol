# 🚀 Guia de Deploy: GitHub & Vercel

## Parte 1: GitHub (✅ FEITO!)

Seu código já está no GitHub!
🔗 **Repositório**: [https://github.com/neimaciel/sol-logistics-ai](https://github.com/neimaciel/sol-logistics-ai)

---

## Parte 2: Vercel

1. **Acesse** [vercel.com](https://vercel.com) e faça login.
2. Clique em **"Add New..."** -> **"Project"**.
3. Selecione **"Import"** ao lado do repositório `sol-logistics-ai`.

### Configuração do Projeto

- **Framework Preset**: Vite (deve detectar automaticamente)
- **Root Directory**: `./` (padrão)

### Variáveis de Ambiente (Environment Variables)

Você precisa adicionar TODAS as variáveis do seu `.env` nas configurações do projeto na Vercel:

| Nome | Valor (Exemplo) |
|------|----------------|
| `VITE_SUPABASE_URL` | `https://....supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_URL` | `https://....supabase.co` |
| `SUPABASE_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (Secret!) |
| `DATABASE_URL` | `postgresql+asyncpg://...` |
| `GEMINI_API_KEY` | `AIza...` |
| `EVOLUTION_API_URL` | `https://api.ampler.me` |
| `EVOLUTION_API_KEY` | `52f13...` |
| `INSTANCE_NAME` | `sol_logistica` |

> **Dica**: Você pode copiar os valores do seu arquivo `backend/.env` e do `.env` na raiz.

### Deploy

1. Clique em **Deploy**.
2. Aguarde a construção.
3. Se tudo der certo, você verá a tela de sucesso! 🎉

---

## Parte 3: Webhook da Evolution API

Depois do deploy, a URL do seu backend mudará.

1. Pegue a URL do seu projeto na Vercel (ex: `https://sol-logistics.vercel.app`).
2. Atualize o Webhook na Evolution API:
   - **Nova URL**: `https://sol-logistics.vercel.app/api/v1/whatsapp/webhook`

```bash
# Exemplo de atualização via cURL
curl -X POST 'https://api.ampler.me/webhook/set/sol_logistica' \
  -H 'apikey: SUA_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://sol-logistics.vercel.app/api/v1/whatsapp/webhook",
    "webhook_by_events": true,
    "events": ["messages.upsert"],
    "enabled": true
  }'
```

---

## 🐛 Troubleshooting no Vercel

- **Erro 500 no Backend**: Verifique os "Logs" na Vercel. Geralmente é variável de ambiente faltando.
- **Frontend não carrega**: Verifique se `VITE_SUPABASE_URL` está configurada.
- **Python Error**: O Vercel tem limite de tempo (10s no plano hobby). Se a IA demorar muito, pode dar timeout. (Para produção robusta, considere Railway ou Render para o backend).
