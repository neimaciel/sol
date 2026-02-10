# 🔍 Referência Rápida - Projeto S.O.L

**Quick Reference Guide para Claude e desenvolvedores**

---

## 🎯 Procurando por...

### Autenticação / Login
- **Login UI:** `src/pages/Login.tsx`
- **Auth Store:** `src/store/useAuthStore.ts`
- **Backend Auth:** `supabase/functions/operators/index.ts` (POST `/auth/login`)
- **API Client:** `src/lib/apiClient.ts` (método `login()`)

### Kanban / Cargas
- **Board UI:** `src/components/kanban/Board.tsx`
- **Card Component:** `src/components/kanban/Card.tsx`
- **Card Modal:** `src/components/card/CardModal.tsx` (7 tabs)
- **Kanban Store:** `src/store/useKanbanStore.ts` ⭐
- **Backend:** `supabase/functions/loads/index.ts`
- **Auto-Advance:** `useKanbanStore.autoAdvanceCard()` + Edge Function endpoint `/loads/:id/auto-advance`

### Motoristas / Drivers
- **Lista UI:** `src/pages/drivers/DriversList.tsx`
- **Perfil UI:** `src/pages/drivers/DriverProfile.tsx`
- **Store:** `src/store/useDriversStore.ts`
- **Backend:** `supabase/functions/drivers/index.ts`
- **Tabela DB:** `drivers`

### Grupos WhatsApp
- **Lista UI:** `src/pages/groups/GroupsList.tsx`
- **Form Modal:** `src/pages/groups/GroupFormModal.tsx`
- **Store:** `src/store/useGroupsStore.ts`
- **Backend:** `supabase/functions/groups/index.ts`
- **Broadcast:** `POST /groups/broadcast`
- **Evolution API:** `src/services/whatsapp.ts`
- **Tabela DB:** `groups`

### Pagamentos
- **Modal UI:** `src/components/payments/PaymentModal.tsx`
- **Store:** `src/store/usePaymentsStore.ts`
- **Backend:** `supabase/functions/payments/index.ts`
- **Tabela DB:** `payments`

### Dashboard / Analytics
- **Dashboard Principal:** `src/pages/Dashboard.tsx`
- **Charts:** `src/components/dashboard/Charts.tsx`
- **Stats Cards:** `src/components/dashboard/StatsCards.tsx`

### Upload de Arquivos
- **Backend:** `supabase/functions/files/index.ts`
- **Supabase Storage:** Bucket configurado
- **API Client:** `apiClient.uploadFile()`

### Mapas
- **Route Map:** `src/components/map/RouteMap.tsx`
- **Map Component:** `src/components/map/Map.tsx`
- **Lib:** Mapbox GL 3.16.0

---

## 📋 APIs e Endpoints

### Base URL
```
https://ekimcihxrnigghnappjv.supabase.co/functions/v1
```

### Autenticação
```http
POST /operators/auth/login
  Body: { email, password }
  Response: { operator, session_token, expires_at }
```

### Cargas (Loads)
```http
GET /loads?limit=100&offset=0
  Auth: Bearer {token}
  Response: [{ id, title, origin, destination, ... }]

GET /loads/:id
  Auth: Bearer {token}
  Response: { id, title, driver: {...}, ... }

POST /loads
  Auth: Bearer {token}
  Body: { title, origin, destination, value, ... }

PUT /loads/:id
  Auth: Bearer {token}
  Body: { ... campos a atualizar }

DELETE /loads/:id
  Auth: Bearer {token}

POST /loads/:id/auto-advance
  Auth: Bearer {token}
  Response: { success, load, previous_column, new_column }
```

### Motoristas (Drivers)
```http
GET /drivers
POST /drivers
PUT /drivers/:id
DELETE /drivers/:id
```

### Grupos (Groups)
```http
GET /groups
POST /groups
PUT /groups/:id
DELETE /groups/:id

POST /groups/broadcast
  Body: { loadId, groupIds, message }
  Response: { results: [{ groupId, success, message }] }
```

### Operadores (Operators)
```http
GET /operators
POST /operators
PUT /operators/:id
DELETE /operators/:id
```

---

## 🗄️ Banco de Dados

### Projeto Supabase
```
URL: https://ekimcihxrnigghnappjv.supabase.co
Ref ID: ekimcihxrnigghnappjv
Region: West US (Oregon)
```

### Tabelas Principais

#### `loads` (Cargas)
```sql
id                UUID PRIMARY KEY
title             VARCHAR(255)
origin            TEXT
destination       TEXT
origin_city       VARCHAR
origin_state      VARCHAR
destination_city  VARCHAR
destination_state VARCHAR
cargo_type        VARCHAR
value             VARCHAR
price             NUMERIC
status            VARCHAR (registration, broadcast, ...)
column_id         VARCHAR (posição no kanban)
priority          VARCHAR (high, normal)
driver_id         UUID → drivers(id)
operator_id       UUID → operators(id)
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

#### `drivers` (Motoristas)
```sql
id           UUID PRIMARY KEY
name         VARCHAR(255)
email        VARCHAR
phone        VARCHAR
vehicle_type VARCHAR
vehicle_plate VARCHAR
status       VARCHAR (active, inactive, vacation)
created_at   TIMESTAMPTZ
updated_at   TIMESTAMPTZ
```

#### `operators` (Operadores)
```sql
id          UUID PRIMARY KEY
name        VARCHAR(255)
email       VARCHAR UNIQUE
password    VARCHAR (hash)
role        VARCHAR
permissions JSONB
status      VARCHAR
created_at  TIMESTAMPTZ
```

#### `groups` (Grupos WhatsApp)
```sql
id             UUID PRIMARY KEY
name           VARCHAR(255)
region         VARCHAR
description    TEXT
whatsapp_id    VARCHAR (ID do grupo WA)
whatsapp_link  TEXT
is_active      BOOLEAN
created_at     TIMESTAMPTZ
```

---

## 🔐 Autenticação

### JWT Token
- **Header:** `Authorization: Bearer {token}`
- **Expiração:** 7 dias
- **Storage:** localStorage (`auth_token`)
- **Refresh:** ⚠️ Não implementado (TODO)

### Login Flow
```
1. User entra email/password
2. POST /operators/auth/login
3. Backend valida e retorna JWT
4. Frontend salva token no localStorage
5. Todas as requisições incluem token no header
6. Backend valida JWT via Supabase Auth
```

### RLS (Row Level Security)
```sql
-- Policies criadas para loads, drivers, operators, groups
-- ⚠️ PROBLEMA: Muito permissivas, permitem qualquer authenticated user
```

---

## 🎨 UI Components

### Base Components (Radix UI)
```
src/components/ui/
├── button.tsx
├── card.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── label.tsx
├── select.tsx
├── table.tsx
├── tabs.tsx
└── textarea.tsx
```

### Theme
- **Provider:** `src/components/theme-provider.tsx`
- **Toggle:** `src/components/mode-toggle.tsx`
- **Modes:** Dark / Light
- **Storage:** localStorage

### Tailwind
```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      // ... mais cores do shadcn/ui
    }
  }
}
```

---

## 🔧 Variáveis de Ambiente

### Frontend (.env.local)
```bash
VITE_SUPABASE_URL=https://ekimcihxrnigghnappjv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_EVOLUTION_API_URL=https://api.evolution.com
VITE_EVOLUTION_API_KEY=seu-api-key
VITE_EVOLUTION_INSTANCE_NAME=sol_logistica
VITE_APP_ENV=development
```

### Backend (Supabase Edge Functions)
```bash
SUPABASE_URL=https://ekimcihxrnigghnappjv.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... (admin)
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
INSTANCE_NAME=...
```

---

## 🐛 Debug

### Logging
```typescript
// src/lib/logger.ts
import { logger } from '@/lib/logger'

logger.log('Info message', data)
logger.warn('Warning', error)
logger.error('Error', error)
```

### Toast Notifications
```typescript
// src/lib/toast.ts
import { toast } from '@/lib/toast'

toast.success('Sucesso!')
toast.error('Erro!')
toast.info('Info')
toast.warning('Atenção')
```

### Browser DevTools
```
Zustand DevTools: window.__ZUSTAND_DEVTOOLS__ = true
React DevTools: Extensão Chrome
Supabase Logs: Dashboard → Logs
```

---

## 📦 Build & Deploy

### Build Local
```bash
npm run build
# Output: /dist
```

### Deploy Vercel (Automático)
```bash
git push origin main
# Vercel detecta push e builda automaticamente
```

### Deploy Edge Functions
```bash
supabase functions deploy
# ou função específica:
supabase functions deploy loads
```

---

## 🔍 Encontrar por Funcionalidade

### "Onde está implementado X?"

| Funcionalidade | Localização |
|----------------|-------------|
| **Drag & Drop do Kanban** | `src/components/kanban/Board.tsx` (@dnd-kit) |
| **Auto-advance de cargas** | `src/store/useKanbanStore.ts:autoAdvanceCard()` |
| **Envio de WhatsApp** | `supabase/functions/groups/index.ts:broadcast` |
| **Upload de arquivos** | `supabase/functions/files/index.ts` |
| **Geração de contratos** | `src/components/contracts/ContractGenerator.tsx` |
| **Mapas com rotas** | `src/components/map/RouteMap.tsx` (Mapbox) |
| **Charts de analytics** | `src/components/dashboard/Charts.tsx` (Recharts) |
| **QR Code para motorista** | `src/pages/driver/PublicLoadView.tsx` (qrcode.react) |
| **Filtros do Kanban** | `src/components/kanban/Board.tsx:filteredCards` |
| **Busca de cargas** | `src/store/useKanbanStore.ts:fetchCards()` |

---

## 🚨 Problemas Conhecidos

### CRÍTICO ⚠️
1. **Credenciais expostas** em `vite.config.ts` e `.env.production`
2. **RLS muito permissivo** - qualquer user vê todos os dados
3. **Schema inconsistente** - campos duplicados PT/EN

### ALTO 🔴
1. **Auto-advance incompleto** - faltam transições
2. **WhatsApp mock** - não envia mensagens reais
3. **SignUp não implementado** - só login funciona
4. **Dois backends** - Edge Functions + FastAPI Python (não usado)

### MÉDIO 🟡
1. **Sem validação de forms** - aceita inputs vazios
2. **Sem paginação** - carrega todas as cargas
3. **Sem refresh de token JWT** - expira em 7 dias
4. **Charts com dados mock** - não usa dados reais

Ver `BUGS_LIST.md` para lista completa.

---

## 📞 Suporte

- **GitHub Issues:** https://github.com/neimaciel/sol/issues
- **Docs Supabase:** https://supabase.com/docs
- **Docs React:** https://react.dev
- **Docs Zustand:** https://docs.pmnd.rs/zustand

---

## 📝 Changelog Rápido

### 2026-02-10
- ✅ Migrados 24 cargas para tabela `loads`
- ✅ Atualizado Vercel env vars para projeto correto
- ✅ Corrigido schema (PT → EN)

### 2026-01-14
- ✅ Auto-advance workflow completo
- ✅ Fix payments schema
- ✅ Add missing columns

### 2025-12-27
- ✅ Initial schema
- ✅ Seed data
- ✅ Enable RLS policies

---

**Última Atualização:** 10 de Fevereiro de 2026
