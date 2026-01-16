# Arquitetura Visual - SOL Logistics

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         USUÁRIO                                  │
│                     (Operador/Admin)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Stores     │          │
│  │  /kanban     │  │  KanbanBoard │  │  useKanban   │          │
│  │  /drivers    │  │  CardModal   │  │  useDrivers  │          │
│  │  /groups     │  │  DriverList  │  │  useAuth     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Libraries & Utils                           │  │
│  │  • apiClient.ts  • toast.ts  • logger.ts  • validation  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Edge Functions (Deno)                          │  │
│  │  • /loads      • /drivers     • /groups                  │  │
│  │  • /operators  • /payments    • /candidates              │  │
│  └─────────────────────┬────────────────────────────────────┘  │
│                        │                                         │
│                        ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           PostgreSQL Database + RLS                       │  │
│  │  Tables: loads, drivers, operators, payments, groups     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               Supabase Storage                            │  │
│  │  Buckets: documents, contracts, receipts, photos         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INTEGRAÇÕES EXTERNAS                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Evolution    │  │  WhatsApp    │  │   Email      │          │
│  │    API       │  │   Business   │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 Estrutura de Diretórios Detalhada

```
sol-logistics/
│
├── 📁 src/
│   │
│   ├── 📁 components/
│   │   ├── 📁 ui/                    # Componentes base (Shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   │
│   │   ├── 📁 kanban/               # Sistema Kanban
│   │   │   ├── KanbanBoard.tsx     # Board principal com DnD
│   │   │   ├── KanbanColumn.tsx    # Coluna individual
│   │   │   └── KanbanCard.tsx      # Card/Load individual
│   │   │
│   │   ├── 📁 card/                # Detalhes da carga
│   │   │   ├── CardModal.tsx       # Modal principal (tabs)
│   │   │   ├── CandidateList.tsx   # Lista de candidatos
│   │   │   └── VehicleRequirements.tsx
│   │   │
│   │   ├── 📁 drivers/             # Gestão de motoristas
│   │   │   ├── DriverList.tsx
│   │   │   ├── DriverCard.tsx
│   │   │   └── DriverFormModal.tsx
│   │   │
│   │   ├── 📁 payments/            # Sistema de pagamentos
│   │   │   ├── PaymentModal.tsx
│   │   │   └── PaymentStatus.tsx
│   │   │
│   │   └── 📁 layout/              # Layout geral
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── 📁 pages/
│   │   ├── LoginPage.tsx           # Autenticação
│   │   ├── KanbanPage.tsx          # Dashboard principal
│   │   ├── DriversPage.tsx         # Gestão motoristas
│   │   ├── GroupsPage.tsx          # Grupos WhatsApp
│   │   ├── HistoryPage.tsx         # Histórico
│   │   └── SettingsPage.tsx        # Configurações
│   │
│   ├── 📁 store/                   # Zustand stores
│   │   ├── useKanbanStore.ts       # ⭐ PRINCIPAL
│   │   ├── useAuthStore.ts         # ⭐ AUTENTICAÇÃO
│   │   ├── usePaymentsStore.ts     # ⭐ PAGAMENTOS
│   │   ├── useDriversStore.ts
│   │   ├── useCandidatesStore.ts
│   │   ├── useGroupsStore.ts
│   │   ├── useCardEventsStore.ts
│   │   ├── useOperatorsStore.ts
│   │   ├── useProductTemplatesStore.ts
│   │   ├── useContractTemplatesStore.ts
│   │   ├── useHistoryStore.ts
│   │   ├── useModelsStore.ts
│   │   ├── useOperatorStore.ts
│   │   └── useWhatsAppStore.ts
│   │
│   ├── 📁 lib/                     # Bibliotecas e utils
│   │   ├── apiClient.ts            # ⭐ Cliente API centralizado
│   │   ├── toast.ts                # ⭐ Notificações toast
│   │   ├── logger.ts               # ⭐ Logger condicional
│   │   ├── validation.ts           # ⭐ Validação de forms
│   │   ├── supabase.ts             # Cliente Supabase
│   │   └── utils.ts                # Funções auxiliares
│   │
│   ├── 📁 hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   │
│   ├── 📁 types/                   # TypeScript types
│   │   └── index.ts
│   │
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Estilos globais
│
├── 📁 supabase/
│   │
│   ├── 📁 functions/               # Edge Functions (Deno)
│   │   ├── 📁 loads/
│   │   │   └── index.ts           # CRUD cargas + auto-advance
│   │   ├── 📁 drivers/
│   │   │   └── index.ts           # CRUD motoristas
│   │   ├── 📁 groups/
│   │   │   └── index.ts           # CRUD grupos WhatsApp
│   │   ├── 📁 operators/
│   │   │   └── index.ts           # Auth + CRUD operadores
│   │   ├── 📁 payments/
│   │   │   └── index.ts           # Criar e confirmar pagamentos
│   │   └── 📁 candidates/
│   │       └── index.ts           # CRUD candidatos
│   │
│   └── 📁 migrations/              # SQL migrations
│       ├── 20250114000001_initial_schema.sql
│       ├── 20250114000002_add_candidates.sql
│       └── 20250114000003_add_auto_advance_columns.sql
│
├── 📁 public/                      # Assets estáticos
│   ├── favicon.ico
│   └── logo.png
│
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 vite.config.ts
├── 📄 tailwind.config.ts
├── 📄 vercel.json
├── 📄 .env.example
└── 📄 README.md
```

---

## 🎯 Mapa de Relacionamentos - Stores

```
useKanbanStore (CENTRAL)
    │
    ├─→ useCardEventsStore    (registra eventos)
    ├─→ useDriversStore       (busca motoristas)
    ├─→ usePaymentsStore      (cria pagamentos)
    └─→ useGroupsStore        (grupos WhatsApp)

useAuthStore
    │
    └─→ api.login/logout      (autenticação)

usePaymentsStore
    │
    ├─→ useKanbanStore        (atualiza status carga)
    └─→ api.payments          (CRUD pagamentos)

useCandidatesStore
    │
    ├─→ useKanbanStore        (atribui motorista)
    └─→ useDriversStore       (dados do motorista)
```

---

## 🔄 Fluxo de Dados - CRUD Típico

### CREATE (Criar nova entidade)

```
┌──────────────┐
│ Componente   │ 1. User action
│   (Form)     │────────┐
└──────────────┘        │
                        ▼
┌──────────────┐    2. Validation
│ validation   │◄───────┘
│   .ts        │────────┐
└──────────────┘        │ 3. Valid?
                        ▼
┌──────────────┐    4. Store method
│   Store      │◄───────┘
│ (Zustand)    │
└──────┬───────┘
       │ 5. API call
       ▼
┌──────────────┐
│  apiClient   │
│    .ts       │
└──────┬───────┘
       │ 6. HTTP POST
       ▼
┌──────────────┐
│ Edge         │
│ Function     │
└──────┬───────┘
       │ 7. SQL INSERT
       ▼
┌──────────────┐
│  Supabase    │
│ PostgreSQL   │
└──────┬───────┘
       │ 8. Response
       ▼
┌──────────────┐
│   Store      │ 9. Update state
│              │────────┐
└──────────────┘        │
                        ▼
┌──────────────┐   10. Show toast
│    toast     │◄───────┘
│    .ts       │
└──────────────┘
       │
       ▼
┌──────────────┐   11. Re-render
│  Component   │◄───────┘
│   (Updated)  │
└──────────────┘
```

---

## 🎨 Fluxo Visual - Kanban Board

```
┌─────────────────────────────────────────────────────────────────────┐
│                        KANBAN BOARD                                  │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ REG  │  │BROAD │  │ SERV │  │ DOC  │  │ RISK │  │ CONT │  ...  │
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤  ├──────┤  ├──────┤       │
│  │Card 1│  │Card 3│  │      │  │Card 5│  │      │  │Card 7│       │
│  │      │  │      │  │      │  │      │  │      │  │      │       │
│  ├──────┤  ├──────┤  │      │  ├──────┤  │      │  │      │       │
│  │Card 2│  │Card 4│  │      │  │Card 6│  │      │  │      │       │
│  │      │  │      │  │      │  │      │  │      │  │      │       │
│  │      │  │      │  │      │  │      │  │      │  │      │       │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘       │
│                                                                      │
│  🖱️ Drag & Drop (dnd-kit)                                          │
└─────────────────────────────────────────────────────────────────────┘
           │
           │ Click no Card
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CARD MODAL                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TABS: [Info] [Candidatos] [Docs] [Contrato] [Pagamento]    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Tab Info:                                                          │
│  ┌────────────────────────────────────────┐                        │
│  │ Título: [Carga SP → RJ         ]      │                        │
│  │ Origem: [São Paulo, SP         ]      │                        │
│  │ Destino: [Rio de Janeiro, RJ   ]      │                        │
│  │ Valor:  [R$ 5.000,00           ]      │                        │
│  │                                        │                        │
│  │ [Salvar]  [Auto-Advance: ON ✓]       │                        │
│  └────────────────────────────────────────┘                        │
│                                                                      │
│  Tab Candidatos:                                                    │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ 🚚 João Silva    ⭐ 4.8  📞 (11) 99999-9999  [Selecionar]  │  │
│  │ 🚚 Maria Costa   ⭐ 4.5  📞 (21) 88888-8888  [Selecionar]  │  │
│  │ 🚚 Pedro Santos  ⭐ 4.9  📞 (31) 77777-7777  [Selecionar]  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Tab Pagamento:                                                     │
│  ┌────────────────────────────────────────┐                        │
│  │ Status: 💸 Pendente                   │                        │
│  │ Valor:  R$ 4.500,00 (motorista)       │                        │
│  │                                        │                        │
│  │ [Criar Pagamento]                     │                        │
│  │ [Upload Comprovante]                  │                        │
│  │ [Confirmar Pagamento Manual]          │                        │
│  └────────────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Fluxo de Autenticação - Estados

```
┌─────────────────┐
│   Usuário não   │
│   autenticado   │
└────────┬────────┘
         │
         ▼
    ┌─────────┐
    │  Login  │
    │  Page   │
    └────┬────┘
         │
         ▼
┌────────────────────┐     Token      ┌──────────────────┐
│ useAuthStore       │───────────────→│  localStorage    │
│ signIn()           │                │  api.setToken()  │
└────────┬───────────┘                └──────────────────┘
         │
         ▼
┌────────────────────┐
│  User authenticated │
│  state.user != null │
└────────┬───────────┘
         │
         ├──→ Acesso a páginas protegidas
         ├──→ Verificação de permissões
         ├──→ Header mostra nome/avatar
         └──→ API calls com Authorization header
```

---

## 📊 Diagrama de Estados - Card/Load

```
                    [CRIADO]
                       │
                       ▼
            ┌──────────────────┐
            │   CADASTRO       │ ← Etapa 1
            │  (registration)  │
            └────────┬─────────┘
                     │ Grupo WhatsApp atribuído
                     ▼
            ┌──────────────────┐
            │   DIVULGAÇÃO     │ ← Etapa 2
            │  (broadcast)     │
            └────────┬─────────┘
                     │ Mensagem enviada
                     ▼
            ┌──────────────────┐
            │  ATENDIMENTO     │ ← Etapa 3
            │ (initial_service)│
            └────────┬─────────┘
                     │ Motorista atribuído
                     ▼
            ┌──────────────────┐
            │  DOCUMENTAÇÃO    │ ← Etapa 4
            │ (documentation)  │
            └────────┬─────────┘
                     │ Docs verificados
                     ▼
            ┌──────────────────┐
            │     RISCO        │ ← Etapa 5
            │    (risk)        │
            └────────┬─────────┘
                     │ Risco aprovado
                     ▼
            ┌──────────────────┐
            │   CONTRATO       │ ← Etapa 6
            │  (contract)      │
            └────────┬─────────┘
                     │ Contrato assinado
                     ▼
            ┌──────────────────┐
            │  CARREGAMENTO    │ ← Etapa 7
            │   (loading)      │
            └────────┬─────────┘
                     │ Check-in feito
                     ▼
            ┌──────────────────┐
            │  EM TRÂNSITO     │ ← Etapa 8
            │   (transit)      │
            └────────┬─────────┘
                     │ Chegou ao destino
                     ▼
            ┌──────────────────┐
            │    DESCARGA      │ ← Etapa 9
            │  (unloading)     │
            └────────┬─────────┘
                     │ POD enviado
                     ▼
            ┌──────────────────┐
            │   FINALIZADO     │ ← Etapa 10
            │  (completed)     │
            └──────────────────┘
                     │
                     ▼
                [ARQUIVADO]
```

---

## 🎯 Componentes React - Hierarquia

```
App
├── Router
│   ├── LoginPage
│   │
│   └── ProtectedRoute
│       ├── Layout
│       │   ├── Sidebar
│       │   └── Header
│       │
│       ├── KanbanPage
│       │   └── KanbanBoard
│       │       ├── KanbanColumn (x10)
│       │       │   └── KanbanCard (xN)
│       │       │       └── CardModal
│       │       │           ├── TabsContent[Info]
│       │       │           ├── TabsContent[Candidatos]
│       │       │           │   └── CandidateList
│       │       │           ├── TabsContent[Documentos]
│       │       │           ├── TabsContent[Contrato]
│       │       │           └── TabsContent[Pagamento]
│       │       │               └── PaymentModal
│       │       │
│       │       └── CardFormModal (criar nova carga)
│       │
│       ├── DriversPage
│       │   ├── DriverList
│       │   │   └── DriverCard (xN)
│       │   └── DriverFormModal
│       │
│       ├── GroupsPage
│       │   ├── GroupList
│       │   └── GroupFormModal
│       │
│       ├── HistoryPage
│       │   └── HistoryTable
│       │
│       └── SettingsPage
│           └── SettingsForm
│
└── ToastContainer (global)
```

---

## 📡 API Endpoints - Referência Rápida

### Autenticação
```
POST   /operators/auth/login      → Login
POST   /operators/auth/logout     → Logout
GET    /operators/auth/me         → Usuário atual
```

### Cargas (Loads)
```
GET    /loads?limit=X&offset=Y    → Listar cargas
POST   /loads                     → Criar carga
PUT    /loads/:id                 → Atualizar carga
DELETE /loads/:id                 → Deletar carga
```

### Motoristas (Drivers)
```
GET    /drivers?limit=X&offset=Y  → Listar motoristas
POST   /drivers                   → Criar motorista
PUT    /drivers/:id               → Atualizar motorista
DELETE /drivers/:id               → Deletar motorista
```

### Grupos WhatsApp
```
GET    /groups?limit=X&offset=Y   → Listar grupos
POST   /groups                    → Criar grupo
PUT    /groups/:id                → Atualizar grupo
DELETE /groups/:id                → Deletar grupo
```

### Pagamentos
```
GET    /payments?load_id=X        → Buscar pagamento por carga
POST   /payments                  → Criar pagamento
PUT    /payments/:id/confirm      → Confirmar pagamento manual
```

### Candidatos
```
GET    /candidates?load_id=X      → Listar candidatos por carga
POST   /candidates                → Adicionar candidato
PUT    /candidates/:id            → Atualizar candidato
```

---

## 🎨 Tema e Estilos

### Tailwind Classes Padrão

```css
/* Layout */
.container { max-width: 1280px; margin: 0 auto; padding: 0 1rem; }

/* Botões */
.btn-primary { bg-blue-600 hover:bg-blue-700 text-white }
.btn-success { bg-green-600 hover:bg-green-700 text-white }
.btn-danger { bg-red-600 hover:bg-red-700 text-white }

/* Cards */
.card { bg-white rounded-lg shadow-md p-4 }

/* Status badges */
.badge-pending { bg-yellow-100 text-yellow-800 }
.badge-approved { bg-green-100 text-green-800 }
.badge-rejected { bg-red-100 text-red-800 }
```

### Cores do Sistema

```
Primary:   #2563eb (blue-600)
Success:   #16a34a (green-600)
Warning:   #eab308 (yellow-500)
Danger:    #dc2626 (red-600)
Info:      #0891b2 (cyan-600)

Background: #f9fafb (gray-50)
Card:       #ffffff (white)
Border:     #e5e7eb (gray-200)
Text:       #111827 (gray-900)
Text-muted: #6b7280 (gray-500)
```

---

## 📱 Responsividade

```
Mobile:  sm: (640px)
Tablet:  md: (768px)
Desktop: lg: (1024px)
Wide:    xl: (1280px)
```

### Breakpoints no Kanban

```typescript
// Mobile: 1 coluna por vez (scroll horizontal)
sm: grid-cols-1

// Tablet: 2-3 colunas visíveis
md: grid-cols-2
lg: grid-cols-3

// Desktop: Todas as 10 colunas (scroll horizontal)
xl: grid-cols-10
```

---

**Versão:** 1.0.0
**Última atualização:** 2025-01-15
