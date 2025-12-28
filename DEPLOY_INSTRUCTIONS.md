# SOL Logistics - Instruções de Deploy

## 📋 Pré-requisitos

1. **Conta Supabase**: Criar conta em https://supabase.com
2. **Supabase CLI**: Já instalado ✅
3. **Docker**: Para desenvolvimento local (opcional)

## 🚀 Deploy no Supabase

### Passo 1: Criar Projeto no Supabase
1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Nome: `sol-logistics`
4. Região: South America (São Paulo)
5. Senha do banco: escolher uma senha segura

### Passo 2: Configurar Banco de Dados
Execute as migrations SQL no SQL Editor do Supabase:

1. **Schema inicial** (`supabase/migrations/20241227000001_initial_schema.sql`):
   - Cria tabelas: drivers, operators, groups, loads, payments
   - Configura indexes e triggers

2. **Dados de exemplo** (`supabase/migrations/20241227000002_seed_data.sql`):
   - Insere dados de teste incluindo o `load-example-1`
   - Motoristas, operadores, grupos e pagamentos de exemplo

### Passo 3: Deploy das Edge Functions
```bash
# No terminal, no diretório do projeto:
cd /Users/neimaciel/Documents/sol-logistics

# Login no Supabase (será solicitado token)
supabase login

# Linkar com o projeto remoto
supabase link --project-ref SEU_PROJECT_ID

# Deploy das functions
supabase functions deploy loads
supabase functions deploy groups  
supabase functions deploy drivers
supabase functions deploy operators
supabase functions deploy payments
```

### Passo 4: Configurar Variáveis de Ambiente

No painel do Supabase (Settings > API):
1. **URL do projeto**: `https://seu-project-id.supabase.co`
2. **Anon key**: chave pública para o frontend
3. **Service key**: chave privada para operações administrativas

## 📱 Configurar Frontend

Atualizar as variáveis de ambiente do frontend para usar as URLs do Supabase:

```typescript
// Substituir no código:
const BASE_URL = 'https://SEU_PROJECT_ID.supabase.co/functions/v1'
```

## 🔧 URLs das Edge Functions

Após o deploy, as APIs estarão disponíveis em:

- **Loads**: `https://seu-project-id.supabase.co/functions/v1/loads`
- **Groups**: `https://seu-project-id.supabase.co/functions/v1/groups` 
- **Drivers**: `https://seu-project-id.supabase.co/functions/v1/drivers`
- **Operators**: `https://seu-project-id.supabase.co/functions/v1/operators`
- **Payments**: `https://seu-project-id.supabase.co/functions/v1/payments`

## ✅ Testar Sistema

1. **Público**: `https://seu-vercel-app.vercel.app/load/load-example-1`
2. **Admin**: `https://seu-vercel-app.vercel.app`
3. **WhatsApp**: Configurar Evolution API (opcional)

## 🔐 Segurança

- Row Level Security (RLS) habilitado automaticamente
- Autenticação via Supabase Auth (opcional)
- CORS configurado nas Edge Functions