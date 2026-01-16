# SOL Logistics - Meta Prompt para Lovable

## 📋 Visão Geral do Sistema

O SOL Logistics é um **TMS (Transportation Management System)** completo para gestão de cargas, motoristas, operadores e fluxos logísticos. O sistema utiliza um workflow Kanban visual com 10 etapas, desde o cadastro até a finalização da carga.

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Frontend**: React 19.2 + TypeScript + Vite
- **UI**: Tailwind CSS 4.x + Shadcn/ui (Radix UI)
- **Estado**: Zustand (state management)
- **Backend**: Supabase (PostgreSQL + Edge Functions em Deno)
- **Deploy**: Vercel (frontend) + Supabase (backend)
- **Autenticação**: JWT personalizado via Edge Functions

### Estrutura de Pastas
```
sol-logistics/
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── ui/           # Componentes base do Shadcn
│   │   ├── kanban/       # Componentes do Kanban
│   │   ├── card/         # Card modal e detalhes
│   │   ├── drivers/      # Gestão de motoristas
│   │   └── payments/     # Sistema de pagamentos
│   ├── pages/            # Páginas da aplicação
│   ├── store/            # Zustand stores (14 stores)
│   ├── lib/              # Utilitários e helpers
│   │   ├── apiClient.ts  # Cliente API centralizado
│   │   ├── toast.ts      # Sistema de notificações
│   │   ├── logger.ts     # Logger condicional
│   │   └── validation.ts # Validação de formulários
│   └── hooks/            # React hooks customizados
├── supabase/
│   ├── functions/        # Edge Functions (Deno)
│   │   ├── loads/       # CRUD de cargas
│   │   ├── drivers/     # CRUD de motoristas
│   │   ├── groups/      # Grupos do WhatsApp
│   │   ├── operators/   # Autenticação e operadores
│   │   └── payments/    # Sistema de pagamentos
│   └── migrations/       # Migrations SQL
└── dist/                 # Build de produção
```

## 🎯 Padrões de Código OBRIGATÓRIOS

### 1. Toast Notifications
**SEMPRE** use toast para feedback ao usuário:
```typescript
import { toast } from '@/lib/toast'

// Sucesso
toast.success('Operação realizada com sucesso!')

// Erro
toast.error('Erro ao realizar operação')

// Warning
toast.warning('Atenção: verifique os dados')

// Info
toast.info('Informação importante')
```

### 2. Logger Condicional
**SEMPRE** use logger ao invés de console:
```typescript
import { logger } from '@/lib/logger'

// Logs apenas em desenvolvimento
logger.log('Informação de debug')
logger.error('Erro encontrado:', error)
logger.warn('Aviso importante')

// Log crítico (sempre exibido, mesmo em produção)
logger.critical('Erro crítico do sistema')
```

### 3. Tratamento de Erros em Stores
**PADRÃO OBRIGATÓRIO** para todos os métodos async em stores:
```typescript
async minhaFuncao: async () => {
  try {
    set({ isLoading: true })

    const result = await api.algumMetodo()

    if (result.success) {
      // Atualizar estado
      toast.success('Sucesso!')
    }
  } catch (error) {
    logger.error('Erro detalhado:', error)
    const message = error instanceof Error ? error.message : 'Erro genérico'
    toast.error(message)
  } finally {
    set({ isLoading: false })
  }
}
```

### 4. Validação de Formulários
**SEMPRE** valide formulários antes de enviar:
```typescript
import { validateForm } from '@/lib/validation'

const schema = {
  name: { required: true, minLength: 3 },
  email: { required: true, email: true },
  cpf: { required: true, cpf: true },
  phone: { required: true }
}

const errors = validateForm(formData, schema)
if (Object.keys(errors).length > 0) {
  setErrors(errors)
  return
}
```

## 📦 Stores (Estado Global)

### Lista Completa de Stores (14)
1. **useKanbanStore** - Workflow principal, cards, colunas, drag & drop
2. **useAuthStore** - Autenticação, login, logout, sessão
3. **usePaymentsStore** - Criação e confirmação de pagamentos
4. **useDriversStore** - CRUD de motoristas
5. **useCandidatesStore** - Candidatos para cargas
6. **useGroupsStore** - Grupos do WhatsApp
7. **useCardEventsStore** - Histórico de eventos dos cards
8. **useOperatorsStore** - Gestão de operadores
9. **useProductTemplatesStore** - Templates de produtos
10. **useContractTemplatesStore** - Templates de contratos
11. **useHistoryStore** - Histórico de cargas finalizadas
12. **useModelsStore** - Modelos de carga reutilizáveis
13. **useOperatorStore** - Operador logado (com persist)
14. **useWhatsAppStore** - Status de conexão WhatsApp

### Padrão de Store
```typescript
import { create } from 'zustand'
import { api } from '@/lib/apiClient'
import { toast } from '@/lib/toast'
import { logger } from '@/lib/logger'

interface MeuStore {
  items: Item[]
  isLoading: boolean
  fetchItems: () => Promise<void>
  addItem: (item: Item) => Promise<void>
}

export const useMeuStore = create<MeuStore>((set, get) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    try {
      set({ isLoading: true })
      const data = await api.getItems()
      set({ items: data })
    } catch (error) {
      logger.error('Error:', error)
      toast.error('Erro ao buscar itens')
    } finally {
      set({ isLoading: false })
    }
  },

  addItem: async (item) => {
    try {
      const result = await api.createItem(item)
      if (result.success) {
        await get().fetchItems()
        toast.success('Item criado com sucesso!')
      }
    } catch (error) {
      logger.error('Error:', error)
      toast.error('Erro ao criar item')
    }
  }
}))
```

## 🔄 Fluxos Principais

### 1. Fluxo de Carga (Kanban Workflow)

**10 Etapas do Kanban:**
1. **Cadastro** → Criar nova carga
2. **Divulgação** → Enviar para grupos WhatsApp
3. **Atendimento** → Receber candidatos
4. **Documentação** → Verificar documentos do motorista
5. **Risco** → Análise de risco
6. **Contrato** → Assinar contrato
7. **Carregamento** → Check-in de carregamento
8. **Em Trânsito** → Carga em rota
9. **Descarga** → POD (Proof of Delivery)
10. **Finalizado** → Pagamento confirmado

**Auto-Advance (Avanço Automático):**
Quando habilitado, o card avança automaticamente quando as condições são atendidas:

```typescript
// Condições por etapa
registration → broadcast: whatsapp_group_id presente
broadcast → initial_service: broadcast_status === 'sent'
initial_service → documentation: driver atribuído
documentation → risk: documents_status === 'verified'
risk → contract: risk_status === 'approved'
contract → loading: contract_url presente
loading → transit: checkin_time presente
transit → unloading: arrival_time presente
unloading → completed: pod_url presente
```

### 2. Fluxo de Autenticação

```typescript
// Login
const { signIn } = useAuthStore()
const { error } = await signIn(email, password)

// Verificar autenticação
const { user } = useAuthStore()
if (!user) {
  navigate('/login')
}

// Logout
const { signOut } = useAuthStore()
await signOut()
```

### 3. Fluxo de Pagamento

```typescript
const { createPayment, confirmManualPayment } = usePaymentsStore()

// Criar pagamento
const payment = await createPayment(loadId, driverId, amount, 'MANUAL')

// Confirmar pagamento manual
await confirmManualPayment(
  payment.id,
  'Pago via PIX',
  'url-do-comprovante.jpg'
)
```

### 4. Fluxo de Atribuição de Motorista

```typescript
const { assignDriver } = useKanbanStore()

// Atribuir motorista ao card
await assignDriver(cardId, driverId)
// Resultado: card move automaticamente para 'documentation'
```

## 🔌 API Client (apiClient.ts)

### Estrutura do API Client
```typescript
// Configuração
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Métodos principais
api.login(email, password)
api.logout()
api.getCurrentUser()

// CRUD Cargas
api.getLoads(limit?, offset?)
api.createLoad(data)
api.updateLoad(id, data)
api.deleteLoad(id)

// CRUD Motoristas
api.getDrivers(limit?, offset?)
api.createDriver(data)
api.updateDriver(id, data)
api.deleteDriver(id)

// CRUD Grupos
api.getGroups(limit?, offset?)
api.createGroup(data)
api.updateGroup(id, data)
api.deleteGroup(id)

// Pagamentos
api.createPayment(data)
api.confirmManualPayment(id, data)
api.getPayment(loadId)
api.getPaymentMethods()
```

## 🗄️ Banco de Dados (Supabase)

### Tabelas Principais

**loads** - Cargas/Cards do Kanban
- id (uuid, PK)
- title (text)
- origin, destination (text)
- value (text)
- priority (text: 'high' | 'normal')
- column_id (text) - Etapa atual
- driver_id (uuid, FK → drivers)
- broadcast_status, risk_status, documents_status, invoice_status
- contract_url, cnh_url, vehicle_doc_url, insurance_url
- whatsapp_group_id (uuid, FK → groups)
- auto_advance (boolean)
- created_at, updated_at

**drivers** - Motoristas
- id (uuid, PK)
- name, phone, cpf_cnpj (text)
- vehicle_type (text)
- photo (text)
- created_at

**groups** - Grupos WhatsApp
- id (uuid, PK)
- name, type, region (text)
- description (text)
- whatsapp_link, whatsapp_id (text)
- members_count (integer)
- created_at

**operators** - Operadores do sistema
- id (uuid, PK)
- email, name, role (text)
- password_hash (text)
- permissions (jsonb)
- created_at, last_login

**candidates** - Candidatos para cargas
- id (uuid, PK)
- load_id (uuid, FK → loads)
- driver_id (uuid, FK → drivers)
- status (text)
- created_at

**payments** - Pagamentos
- id (uuid, PK)
- load_id (uuid, FK → loads)
- driver_id (uuid, FK → drivers)
- amount (numeric)
- status (text)
- method (text)
- receipt_url (text)
- created_at, processed_at

### RLS (Row Level Security)
**TODAS** as tabelas possuem RLS ativado. As políticas verificam:
- Autenticação via JWT
- Role do operador (admin, senior, pleno, junior)
- Permissões específicas no JSONB permissions

## 🚀 Edge Functions (Backend)

### Estrutura de Edge Function
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar Supabase
    const supabase = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    })

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError

    // Roteamento
    const url = new URL(req.url)

    if (req.method === 'GET') {
      // Listar
      const { data, error } = await supabase
        .from('tabela')
        .select('*')

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      // Criar
      const body = await req.json()
      // ... lógica
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Functions Disponíveis
- **loads** - GET, POST, PUT, DELETE (CRUD completo + auto-advance)
- **drivers** - GET, POST, PUT, DELETE
- **groups** - GET, POST, PUT, DELETE
- **operators/auth/login** - POST (autenticação)
- **operators/auth/logout** - POST
- **operators/auth/me** - GET (usuário atual)
- **payments** - POST (criar), PUT (confirmar)

## 🎨 Componentes UI (Shadcn)

### Componentes Principais Usados
- Dialog, DialogContent, DialogHeader, DialogTitle
- Button, Input, Label, Textarea
- Select, SelectContent, SelectItem
- Tabs, TabsContent, TabsList, TabsTrigger
- Badge, Avatar, Switch
- Card, CardContent, CardHeader

### Padrão de Uso
```typescript
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
    <div>Conteúdo</div>
  </DialogContent>
</Dialog>
```

## 🔐 Autenticação e Permissões

### Estrutura de Permissões
```typescript
interface Permissions {
  can_manage_drivers: boolean
  can_manage_loads: boolean
  can_confirm_payments: boolean
  can_manage_operators: boolean
  can_access_reports: boolean
  can_manage_contracts: boolean
}
```

### Verificação de Permissões
```typescript
const { user } = useAuthStore()

if (!user) {
  return <Navigate to="/login" />
}

if (!user.permissions.can_manage_drivers) {
  return <div>Sem permissão</div>
}
```

## 🌐 Variáveis de Ambiente

```env
# Supabase
VITE_SUPABASE_URL=https://ekimcihxrnigghnappjv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Ambiente
VITE_APP_ENV=development  # ou production
```

## 📱 Integrações

### WhatsApp (Evolution API)
```typescript
const evolutionApiUrl = 'https://api.ampler.me'
const evolutionApiKey = '52f13a23...'

// Enviar mensagem
await fetch(`${evolutionApiUrl}/message/sendText/SOL`, {
  method: 'POST',
  headers: {
    'apikey': evolutionApiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: '5511999999999',
    text: 'Mensagem'
  })
})
```

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Deploy
npx vercel --prod --yes

# Supabase local
supabase start
supabase functions serve

# Supabase deploy
supabase functions deploy loads
supabase db push
```

## ⚠️ Regras CRÍTICAS

1. **NUNCA** use console.log/error/warn → use logger
2. **SEMPRE** mostre toast em operações assíncronas
3. **SEMPRE** valide formulários antes de enviar
4. **NUNCA** faça deploy sem rodar `npm run build`
5. **SEMPRE** teste localmente antes de deploy
6. **NUNCA** commite secrets ou tokens
7. **SEMPRE** use TypeScript strict mode
8. **SEMPRE** trate erros com try-catch
9. **SEMPRE** use optimistic updates em operações UI
10. **NUNCA** modifique RLS sem revisar segurança

## 🔄 Workflow de Desenvolvimento

1. Criar branch feature
2. Desenvolver localmente
3. Testar com `npm run dev`
4. Build com `npm run build`
5. Testar build com `npm run preview`
6. Commit e push
7. Deploy via Vercel (automático)
8. Validar em produção

## 📚 Referências

- React: https://react.dev
- Zustand: https://zustand.docs.pmnd.rs
- Supabase: https://supabase.com/docs
- Shadcn: https://ui.shadcn.com
- Tailwind: https://tailwindcss.com

---

**Versão:** 1.0.0
**Última atualização:** 2025-01-15
**Sistema:** SOL Logistics TMS
