# 📁 Estrutura do Projeto S.O.L

**Sistema de Operação Logística**
**Última Atualização:** 10 de Fevereiro de 2026

---

## 🎯 Visão Geral

Sistema fullstack para gestão de cargas e logística com:
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Supabase Edge Functions (Deno)
- **Banco:** PostgreSQL (Supabase)
- **Integrações:** WhatsApp (Evolution API), Mapbox

---

## 📂 Estrutura de Diretórios

```
S.O.L/
├── 📱 src/                          # Frontend React + TypeScript
│   ├── 🎨 components/               # Componentes UI (49 arquivos)
│   │   ├── card/                    # Modais de cargas (3)
│   │   ├── kanban/                  # Board Kanban (4)
│   │   ├── ui/                      # Componentes base (15)
│   │   ├── dashboard/               # Charts e stats (2)
│   │   ├── drivers/                 # Motoristas (2)
│   │   ├── map/                     # Mapbox (2)
│   │   └── ...
│   │
│   ├── 📄 pages/                    # Páginas/Rotas (14 arquivos)
│   │   ├── Dashboard.tsx            # ⭐ Dashboard principal (479 linhas)
│   │   ├── Login.tsx                # Login
│   │   ├── drivers/                 # Gestão de motoristas
│   │   ├── groups/                  # Grupos WhatsApp
│   │   ├── models/                  # Templates de cargas
│   │   └── ...
│   │
│   ├── 🗂️ store/                    # Zustand stores (15 stores)
│   │   ├── useKanbanStore.ts        # ⭐ Estado principal (447 linhas)
│   │   ├── useAuthStore.ts          # Autenticação
│   │   ├── useDriversStore.ts       # Motoristas
│   │   ├── useGroupsStore.ts        # Grupos
│   │   └── ...
│   │
│   ├── 🛠️ lib/                      # Utilitários
│   │   ├── apiClient.ts             # ⭐ Cliente HTTP (900+ linhas)
│   │   ├── supabase.ts              # Cliente Supabase
│   │   ├── logger.ts                # Logging
│   │   ├── toast.ts                 # Notificações
│   │   └── validation.ts            # Validações
│   │
│   ├── 🌐 services/                 # Serviços externos
│   │   └── whatsapp.ts              # Evolution API
│   │
│   ├── App.tsx                      # Root component
│   └── main.tsx                     # Entry point
│
├── ⚡ supabase/
│   ├── functions/                   # Edge Functions (8 functions)
│   │   ├── loads/                   # ⭐ CRUD de cargas
│   │   ├── drivers/                 # CRUD de motoristas
│   │   ├── operators/               # Auth e operadores
│   │   ├── groups/                  # Grupos WhatsApp
│   │   ├── candidates/              # Candidatos a cargas
│   │   ├── payments/                # Pagamentos
│   │   └── files/                   # Upload de arquivos
│   │
│   └── migrations/                  # SQL migrations (11 arquivos)
│       ├── 20241227000001_initial_schema.sql
│       ├── 20260106183302_remote_schema.sql
│       ├── 20260210000000_seed_data.sql
│       └── ...
│
├── 🐍 backend/                      # ⚠️ Backend Python (NÃO USADO!)
│   ├── main.py
│   ├── routers/
│   └── models/
│
├── ⚙️ Configs
│   ├── package.json                 # Dependências NPM
│   ├── tsconfig.json                # TypeScript config
│   ├── vite.config.ts               # Vite bundler
│   ├── tailwind.config.js           # Tailwind CSS
│   ├── vercel.json                  # Vercel deploy
│   └── .env.example                 # Variáveis de ambiente
│
└── 📚 Docs
    ├── README.md
    ├── PROJECT_STRUCTURE.md         # ⭐ Este arquivo
    ├── PROJECT_REFERENCE.md         # Referência rápida
    ├── BUGS_LIST.md                 # Lista de bugs
    └── ANALISE_COMPLETA.md          # Análise detalhada
```

---

## 🎯 Arquivos Principais (Importância Alta)

### Frontend

| Arquivo | Linhas | Responsabilidade | Complexidade |
|---------|--------|------------------|--------------|
| **src/store/useKanbanStore.ts** | 447 | Estado principal do Kanban, auto-advance | ⭐⭐⭐⭐⭐ |
| **src/lib/apiClient.ts** | 900+ | Cliente HTTP, todas as chamadas API | ⭐⭐⭐⭐⭐ |
| **src/pages/Dashboard.tsx** | 479 | Dashboard principal, analytics | ⭐⭐⭐⭐ |
| **src/components/card/CardModal.tsx** | 600+ | Modal de carga com 7 tabs | ⭐⭐⭐⭐ |
| **src/components/kanban/Board.tsx** | 300+ | Board Kanban, drag-and-drop | ⭐⭐⭐⭐ |
| **src/store/useAuthStore.ts** | 200+ | Autenticação, sessão | ⭐⭐⭐ |

### Backend

| Arquivo | Linhas | Responsabilidade | Status |
|---------|--------|------------------|--------|
| **supabase/functions/loads/index.ts** | 313 | CRUD de cargas + auto-advance | ✅ Ativo |
| **supabase/functions/operators/index.ts** | 200+ | Auth JWT + CRUD operadores | ✅ Ativo |
| **supabase/functions/groups/index.ts** | 250+ | CRUD grupos + broadcast WhatsApp | ⚠️ Mock |
| **backend/main.py** | 400+ | FastAPI Python | ❌ NÃO USADO |

---

## 🗺️ Fluxo de Dados

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │
       ├─► Login/Auth
       │   └─► supabase/functions/operators → Auth JWT
       │
       ├─► Kanban Board
       │   ├─► GET /loads → supabase/functions/loads
       │   ├─► POST /loads/auto-advance
       │   └─► Zustand (useKanbanStore)
       │
       ├─► Motoristas
       │   └─► supabase/functions/drivers
       │
       ├─► WhatsApp
       │   └─► supabase/functions/groups/broadcast
       │       └─► Evolution API (externa)
       │
       └─► Upload Arquivos
           └─► supabase/functions/files
               └─► Supabase Storage
```

---

## 🔑 Conceitos-Chave

### Kanban Workflow

```
Carga → Registration → Broadcast → Initial Service → Risk Analysis
     → Documentation → Negotiation → Contract → Loading → In Transit
     → Unloading → Delivery → Payment → Completed
```

### Auto-Advance

Sistema que move cargas automaticamente entre colunas quando condições são satisfeitas:
- **Registration → Broadcast:** Quando WhatsApp group_id definido
- **Broadcast → Initial Service:** Quando broadcast enviado
- **Contract → Loading:** Quando contrato assinado
- etc.

### Stores (Estado Global)

- **useKanbanStore:** Estado principal (cards, colunas, filtros)
- **useAuthStore:** Sessão do usuário
- **useDriversStore:** Lista de motoristas
- **useGroupsStore:** Grupos WhatsApp
- Mais 11 stores auxiliares

---

## 📦 Dependências Principais

### Frontend
```json
{
  "react": "19.2.0",
  "typescript": "5.9.3",
  "vite": "7.2.2",
  "zustand": "5.0.8",
  "@supabase/supabase-js": "2.89.0",
  "@tanstack/react-query": "5.90.10",
  "@dnd-kit/core": "6.3.1",
  "framer-motion": "12.23.24",
  "tailwindcss": "4.1.17",
  "mapbox-gl": "3.16.0",
  "recharts": "3.4.1"
}
```

### Backend
```
Supabase Edge Functions (Deno runtime)
```

---

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
npm run dev              # Inicia dev server (http://localhost:5173)
npm run build            # Build para produção
npm run preview          # Preview do build
```

### Supabase
```bash
supabase login                    # Login no Supabase
supabase link                     # Link com projeto remoto
supabase db push                  # Aplicar migrations
supabase functions deploy         # Deploy Edge Functions
supabase functions deploy loads   # Deploy função específica
```

### Git
```bash
git status
git add .
git commit -m "mensagem"
git push origin main
```

---

## 🔧 Configuração Local

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local

# Editar .env.local:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
VITE_EVOLUTION_API_URL=https://api.evolution.com
VITE_EVOLUTION_API_KEY=sua-chave-evolution
```

### 3. Rodar Migrations
```bash
supabase db push
```

### 4. Iniciar Dev Server
```bash
npm run dev
```

---

## 📊 Métricas

- **Total de Arquivos:** ~100+ arquivos de código
- **Linhas de Código:** ~15.000+ linhas
- **Componentes React:** 49 componentes
- **Zustand Stores:** 15 stores
- **Edge Functions:** 8 functions
- **SQL Migrations:** 11 migrations
- **Dependências:** 29 produção + 11 dev

---

## ⚠️ Notas Importantes

1. **Backend Python não é usado** - Apenas Supabase Edge Functions
2. **React 19 é muito recente** - Possíveis incompatibilidades
3. **Tailwind 4 está em beta** - Versão não-estável
4. **Evolution API precisa configuração** - WhatsApp não funciona por padrão

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard/project/ekimcihxrnigghnappjv
- **Vercel:** https://vercel.com/dashboard
- **GitHub:** https://github.com/neimaciel/sol
- **Documentação Supabase:** https://supabase.com/docs
- **Documentação React:** https://react.dev
