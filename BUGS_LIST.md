# 🐛 Lista Completa de Bugs - S.O.L

**Total de Problemas Identificados:** 52+
**Data:** 10 de Fevereiro de 2026
**Status:** 🔴 NÃO PRONTO PARA PRODUÇÃO

---

## 📊 Resumo por Severidade

| Severidade | Quantidade | Status |
|-----------|------------|--------|
| 🔴 **CRÍTICO (Segurança)** | 8 | ❌ BLOCKER |
| 🟠 **ALTO (Funcionalidade)** | 15 | ⚠️ Urgente |
| 🟡 **MÉDIO (Qualidade)** | 29+ | ⏳ Importante |
| 🟢 **BAIXO (Melhorias)** | - | ✅ Nice to have |

---

## 🔴 CRÍTICO - Bloqueadores de Produção

### ✅ P9, P19, P33: Credenciais Hardcoded no Código
**Severidade:** 🔴 CRÍTICO (Segurança)
**Impacto:** Exposição de credenciais do Supabase
**Localização:** Múltiplos arquivos (scripts, código-fonte)
**Status:** ✅ RESOLVIDO (2026-02-10)

**Problema:**
Credenciais do Supabase (URL, ANON_KEY, SERVICE_KEY) estavam hardcoded em 18 arquivos:
- Scripts: apply-migrations.sh, add-vercel-env.sh, setup_vercel_env.sh
- Código JS: create_db.js, insert_load.js, copy_data_to_loads.js
- Código TS/TSX: useOperatorStore.ts, CardModal.tsx, DriverProfile.tsx, DriverPortal.tsx, AgentAdmin.tsx

**Solução Implementada:**

1. **Scripts Shell**:
   - `apply-migrations.sh`: Agora lê de variáveis de ambiente com validação
   - `add-vercel-env.sh`: Carrega de .env.local (não versionado)
   - `setup_vercel_env.sh`: Carrega de .env.local com fallbacks

2. **Scripts JavaScript**:
   - `create_db.js`: Usa `dotenv` e `process.env.SUPABASE_SERVICE_ROLE_KEY`
   - `insert_load.js`: Usa `dotenv` e `process.env.SUPABASE_SERVICE_ROLE_KEY`
   - `copy_data_to_loads.js`: Usa `dotenv` e valida variáveis

3. **Código TypeScript/TSX**:
   - `useOperatorStore.ts`: Usa `import.meta.env.VITE_SUPABASE_ANON_KEY`
   - `CardModal.tsx`: Usa `import.meta.env.VITE_SUPABASE_URL`
   - `DriverProfile.tsx`: Usa `import.meta.env.VITE_SUPABASE_URL`
   - `DriverPortal.tsx`: Usa `import.meta.env.VITE_SUPABASE_URL` (2 ocorrências)
   - `AgentAdmin.tsx`: Usa `import.meta.env.VITE_SUPABASE_URL`

4. **Arquivos de Configuração**:
   - `.env.production`: JÁ no `.gitignore` (linha 23)
   - `.env.production`: NÃO está versionado no Git ✅
   - `vite.config.ts`: JÁ estava correto (sem fallbacks)

**⚠️ AÇÃO NECESSÁRIA** (Manual):
1. ❗ **CRÍTICO**: Regenerar TODAS as chaves do Supabase:
   - Anon Key
   - Service Role Key
   - JWT Secret
2. Atualizar variáveis no Vercel com novas chaves
3. Atualizar .env.local com novas chaves

**Teste:**
```bash
# Scripts agora exigem variáveis de ambiente:
export SUPABASE_URL="sua-url"
export SUPABASE_SERVICE_KEY="sua-chave"
bash apply-migrations.sh
```

---

### ✅ P21: RLS (Row Level Security) Muito Permissivo
**Severidade:** 🔴 CRÍTICO (Segurança)
**Impacto:** Vazamento de dados entre empresas/operadores
**Localização:** Todas as tabelas principais
**Status:** ✅ RESOLVIDO (2026-02-10)

**Problema:**
Políticas RLS permitiam acesso a TODOS os registros sem restrição (`USING (true)`), causando:
- Vazamento de dados entre operadores
- Falta de segregação por empresa/operador
- Violação do princípio de menor privilégio

**Solução Implementada:**

**Migration:** `20260210140000_fix_rls_policies.sql`

1. **Funções Helper**:
   - `auth.user_id()`: Extrai user ID do JWT
   - `is_admin()`: Verifica se usuário é admin
   - `has_permission(name)`: Verifica permissões específicas

2. **Políticas RLS por Tabela**:

   **LOADS** (Cargas):
   - SELECT: Apenas cargas do próprio operador OU admin
   - INSERT: Requer permissão 'editar' e define operator_id
   - UPDATE: Apenas próprias cargas OU admin
   - DELETE: Apenas admins

   **DRIVERS** (Motoristas):
   - SELECT: Todos (necessário para atribuir a cargas)
   - INSERT/UPDATE: Requer permissão 'editar' OU admin
   - DELETE: Apenas admins

   **OPERATORS** (Operadores):
   - SELECT: Apenas próprio perfil OU admin vê todos
   - INSERT: Apenas admins
   - UPDATE: Próprio perfil OU admin
   - DELETE: Apenas admins

   **PAYMENTS** (Pagamentos):
   - Todas operações: Apenas para cargas do próprio operador OU admin

   **CANDIDATES** (Candidatos):
   - Todas operações: Apenas para cargas do próprio operador OU admin

   **GROUPS & LOAD_MODELS**:
   - SELECT: Todos
   - Outras operações: Requer permissão 'editar' OU admin

3. **Migração de Dados**:
   - Cargas sem `operator_id` foram atribuídas ao primeiro admin

**Teste:**
1. Login como operador normal → vê apenas suas cargas
2. Login como admin → vê todas as cargas
3. Tentar acessar carga de outro operador → bloqueado

---

### ✅ P34: Sem Sanitização de Inputs
**Severidade:** 🔴 ALTO (Segurança)
**Impacto:** XSS, SQL Injection, Path Traversal
**Localização:** Todos os formulários
**Status:** ✅ RESOLVIDO (2026-02-10)

**Problema:**
Inputs de formulários não eram sanitizados/validados, permitindo:
- **XSS**: Scripts maliciosos em campos de texto
- **Path Traversal**: Manipulação de caminhos de arquivo
- **Dados inválidos**: Formatos incorretos (email, telefone, CPF, etc.)

**Solução Implementada:**

**Biblioteca:** `src/lib/sanitize.ts`

1. **Funções de Sanitização**:
   - `sanitizeHTML()`: Remove todos os tags HTML (anti-XSS)
   - `sanitizeText()`: Escapa entidades HTML
   - `sanitizeEmail()`: Valida e normaliza emails
   - `sanitizePhone()`: Remove formatação, mantém apenas dígitos
   - `sanitizeURL()`: Valida e normaliza URLs
   - `sanitizeNumber()`: Parse seguro de números
   - `sanitizeCPF_CNPJ()`: Remove formatação, valida comprimento
   - `sanitizePlate()`: Valida placas brasileiras (ABC1234 / ABC1D23)
   - `sanitizeFilePath()`: Previne path traversal
   - `sanitizeObject()`: Sanitiza recursivamente objetos
   - `sanitizeFormData()`: Sanitizador completo com schema

2. **Proteções Existentes**:
   - **React**: JSX escapa por padrão (anti-XSS em rendering)
   - **Supabase**: Prepared statements (anti-SQL injection)
   - **Zod schemas**: Já implementados em schemas.ts para validação de tipos

3. **Como Usar**:
   ```typescript
   import { sanitizeFormData, sanitizeText } from '@/lib/sanitize'

   // Sanitizar formulário completo
   const handleSubmit = (e: FormEvent) => {
     e.preventDefault()
     const clean = sanitizeFormData(formData, {
       email: 'email',
       phone: 'phone',
       cpf_cnpj: 'cpf_cnpj',
       title: 'text'
     })
     await createLoad(clean)
   }

   // Sanitizar campo individual
   const cleanTitle = sanitizeText(title)
   ```

4. **Validações Implementadas**:
   - Email: RFC compliant
   - Phone: Apenas dígitos
   - CPF/CNPJ: 11 ou 14 dígitos
   - Placas: Formato brasileiro (antiga e Mercosul)
   - URLs: Protocolo obrigatório
   - File paths: Anti-traversal

**Próximos Passos** (Opcional):
- Aplicar sanitizeFormData() em formulários restantes
- Adicionar validação client-side com mensagens de erro
- Implementar rate limiting em Edge Functions

**Teste:**
```typescript
sanitizeHTML('<script>alert("xss")</script>') // ""
sanitizeEmail('  USER@DOMAIN.COM  ') // "user@domain.com"
sanitizePlate('ABC-1234') // "ABC1234"
sanitizeCPF_CNPJ('123.456.789-00') // "12345678900"
```

---

### P15: Schema da Tabela `payments` Incompleto
**Severidade:** 🔴 CRÍTICO (Dados)
**Impacto:** Perda de dados, queries quebradas
**Localização:** Tabela `payments` no Supabase

**Problema:**
Migration `20250114000002_fix_payments_schema.sql` adiciona colunas:
```sql
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS manual_confirmed_by UUID,
  ADD COLUMN IF NOT EXISTS manual_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS bank_data JSONB;
```

Mas não está claro se foi aplicada no banco remoto.

**Solução:**
```bash
supabase db push
```

Verificar:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'payments';
```

**Status:** ✅ CORRIGIDO
**Data:** 2026-02-10
**Migration:** `20260210150100_fix_payments_schema.sql`
**Adicionado:** 15 novas colunas + funções helper + triggers + RLS policies

---

### P16: Tabela `operators` Pode Não Existir
**Severidade:** 🔴 CRÍTICO (Dados)
**Impacto:** Auth quebrado, sistema não funciona
**Localização:** Banco de dados

**Problema:**
Segundo `LEIA_ME_PRIMEIRO.md`:
```markdown
## ❌ Problema Encontrado: Tabelas Faltando no Banco

### Erro Principal
A tabela `operators` **não existe** no banco de dados Supabase.
```

**Solução:**
1. Verificar se tabela existe:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'operators';
   ```

2. Se não existir, executar migration:
   ```bash
   supabase db push --include-all
   ```

**Status:** ⚠️ NÃO CONFIRMADO

---

### P35: Sem Rate Limiting
**Severidade:** 🔴 MÉDIO (Segurança)
**Impacto:** Brute force, DDoS
**Localização:** Todas as APIs

**Problema:**
- Nenhuma proteção contra brute force no login
- Nenhum limite de requisições
- Vulnerável a DDoS

**Solução:**
Implementar no Edge Function:
```typescript
// supabase/functions/_shared/rate-limit.ts
import { createClient } from '@supabase/supabase-js'

const rateLimits = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(ip: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const limit = rateLimits.get(ip)

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (limit.count >= maxRequests) {
    return false // Rate limited
  }

  limit.count++
  return true
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P36: Tokens JWT Sem Refresh Automático
**Severidade:** 🔴 ALTO (UX)
**Impacto:** Usuário deslogado sem aviso
**Localização:** `src/store/useAuthStore.ts`

**Problema:**
```typescript
// Expira em 7 dias mas não refresh
expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
```

**Solução:**
```typescript
// useAuthStore.ts
initialize: async () => {
  const token = api.getToken()
  if (!token) return

  // ✅ Verificar expiração
  const expiresAt = localStorage.getItem('auth_expires_at')
  if (expiresAt && new Date(expiresAt) < new Date()) {
    // Token expirado
    set({ isAuthenticated: false, currentUser: null })
    api.clearToken()
    toast.warning('Sessão expirada. Faça login novamente.')
    return
  }

  // ✅ Agendar refresh antes de expirar
  const timeToExpire = new Date(expiresAt).getTime() - Date.now()
  if (timeToExpire > 0) {
    setTimeout(async () => {
      // Refresh token
      const newToken = await api.refreshToken()
      if (newToken) {
        localStorage.setItem('auth_token', newToken.token)
        localStorage.setItem('auth_expires_at', newToken.expires_at)
      }
    }, timeToExpire - 60000) // 1 min antes
  }
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P37: CORS Muito Permissivo
**Severidade:** 🔴 MÉDIO (Segurança)
**Impacto:** Requisições de origens não autorizadas
**Localização:** `backend/main.py` (Python - não usado)

**Problema:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ❌ Permite qualquer origem!
    allow_credentials=True,
)
```

**Solução:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sol.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

**Status:** ⚠️ Backend Python não é usado, mas deveria ser removido

---

## 🟠 ALTO - Funcionalidade Crítica

### P4: Auto-Advance Incompleto
**Severidade:** 🟠 ALTO (Funcionalidade)
**Impacto:** Cargas travadas, workflow quebrado
**Localização:** `src/store/useKanbanStore.ts:346-440`

**Problema:**
```typescript
const transitions: Record<string, TransitionRule> = {
  'registration': { next: 'broadcast', condition: () => !!card.whatsapp_group_id },
  // ...
  'unloading': { next: 'completed', condition: () => !!card.pod_url }
  // ❌ Falta 'completed': { next: ???, condition: ??? }
}
```

Problemas:
1. Sem transição para estado `completed`
2. Sem caminho de rejeição (risk rejected, docs rejected)
3. Race condition: usuário arrasta enquanto auto-advance processa

**Solução:**
```typescript
const transitions: Record<string, TransitionRule> = {
  // ... transições existentes
  'completed': {
    next: null, // Estado final
    condition: () => true
  },

  // Caminhos de rejeição
  'risk_analysis': {
    next: 'broadcast', // Se aprovado
    nextOnFail: 'registration', // Se rejeitado
    condition: () => card.risk_status === 'approved',
    onFail: () => {
      toast.warning('Análise de risco rejeitada')
    }
  },
}

// Prevenir race condition
let isAutoAdvancing = false
autoAdvanceCard: async (cardId, trigger) => {
  if (isAutoAdvancing) return
  isAutoAdvancing = true
  try {
    // ... lógica
  } finally {
    isAutoAdvancing = false
  }
}
```

**Status:** ✅ CORRIGIDO
**Data:** 2026-02-10
**Mudanças:**
- ✅ Adicionada transição para estado 'completed' (estado final com next: null)
- ✅ Implementados caminhos de rejeição para 'documentation' → 'initial_service'
- ✅ Implementados caminhos de rejeição para 'risk' → 'broadcast'
- ✅ Adicionado lock mechanism (autoAdvanceLocks Set) para prevenir race conditions
- ✅ Adicionados botões "Reprovar" na UI para documentação e risco
- ✅ Atualizado tipo de `documents_status` para incluir 'rejected'
- ✅ Melhorada nomenclatura das colunas no toast de sucesso

---

### P12: Edge Function `candidates` Incompleta
**Severidade:** 🟠 ALTO (Funcionalidade)
**Impacto:** Seleção de motoristas quebrada
**Localização:** `supabase/functions/candidates/index.ts`

**Problema:**
Frontend tenta chamar:
```typescript
// src/lib/apiClient.ts:594-612
async selectCandidate(candidateId: string) {
  const url = `${SUPABASE_URL}/functions/v1/candidates/${candidateId}/select`
  // ❌ Este endpoint não existe!
}

async getCandidatesByLoad(loadId: string) {
  const url = `${SUPABASE_URL}/functions/v1/candidates/by-load/${loadId}`
  // ❌ Este endpoint não existe!
}
```

**Solução:**
Adicionar à Edge Function:
```typescript
// supabase/functions/candidates/index.ts

if (method === 'POST' && pathParts[2] && pathParts[3] === 'select') {
  // POST /candidates/:id/select
  const candidateId = pathParts[2]

  const { data: candidate, error } = await supabase
    .from('candidates')
    .update({ selected: true })
    .eq('id', candidateId)
    .select()
    .single()

  if (error) throw error

  // Atualizar carga com driver
  await supabase
    .from('loads')
    .update({ driver_id: candidate.driver_id })
    .eq('id', candidate.load_id)

  return new Response(JSON.stringify(candidate), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}

if (method === 'GET' && pathParts[2] === 'by-load') {
  // GET /candidates/by-load/:loadId
  const loadId = pathParts[3]

  const { data, error } = await supabase
    .from('candidates')
    .select('*, driver:drivers(*)')
    .eq('load_id', loadId)

  if (error) throw error

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  })
}
```

**Status:** ✅ CORRIGIDO
**Data:** 2026-02-10
**Mudanças:**
- ✅ Endpoints já existiam (getCandidatesByLoad, selectCandidate)
- ✅ **CRÍTICO:** Adicionado update do load com driver_id ao selecionar candidato
- ✅ Auto-advance para 'documentation' ao selecionar candidato
- ✅ Atualização de preço se candidato propôs valor diferente
- ✅ Novo endpoint: POST /candidates/{id}/reject (rejeitar com motivo)
- ✅ Novo endpoint: POST /candidates/{id}/negotiate (iniciar negociação)
- ✅ Melhor logging e error handling

---

### P13: Auto-Advance na Edge Function Incompleto
**Severidade:** 🟠 ALTO (Funcionalidade)
**Impacto:** Condições não funcionam, auto-advance falha
**Localização:** `supabase/functions/loads/index.ts:155-300`

**Status:** ✅ CORRIGIDO
**Data:** 2026-02-10
**Migration:** `20260210150000_add_missing_loads_columns.sql`

**Problema:**
```typescript
if (transition.conditions.includes('payment_confirmed')) {
  if (!load.payment_confirmed_at) { // ❌ Coluna não existe!
    canAdvance = false
  }
}
```

Colunas referenciadas mas não existem:
- `contract_signed_at`
- `trip_started_at`
- `delivered_at`
- `payment_confirmed_at`
- `cnh_url`
- `vehicle_doc_url`
- `insurance_url`

**Solução:**
1. Adicionar colunas à tabela `loads`:
```sql
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trip_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cnh_url TEXT,
  ADD COLUMN IF NOT EXISTS vehicle_doc_url TEXT,
  ADD COLUMN IF NOT EXISTS insurance_url TEXT;
```

2. Ou remover checagens de colunas inexistentes

**Status:** ❌ NÃO CORRIGIDO

---

### P23: Evolution API Não Configurada
**Severidade:** 🟠 ALTO (Funcionalidade)
**Impacto:** WhatsApp não envia mensagens
**Localização:** `supabase/functions/groups/index.ts:154-191`

**Problema:**
```typescript
const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')

if (evolutionApiUrl && evolutionApiKey) {
  // Envia mensagem
} else {
  // ❌ Retorna sucesso falso!
  results.push({
    groupId,
    success: true, // ❌ Mente que enviou!
    message: 'WhatsApp API not configured'
  })
}
```

**Solução:**
1. Configurar variáveis de ambiente no Supabase:
```bash
supabase secrets set EVOLUTION_API_URL=https://api.evolution.com
supabase secrets set EVOLUTION_API_KEY=sua-chave
supabase secrets set INSTANCE_NAME=sol_logistica
```

2. Testar conexão:
```typescript
// Verificar antes de broadcast
const testUrl = `${evolutionApiUrl}/instance/connectionState/${instanceName}`
const testResponse = await fetch(testUrl, {
  headers: { 'apikey': evolutionApiKey }
})
if (!testResponse.ok) {
  throw new Error('Evolution API não conectada')
}
```

**Status:** ❌ NÃO CONFIGURADO

---

### P24: Broadcast WhatsApp Usa Endpoint Errado
**Severidade:** 🟠 ALTO (Funcionalidade)
**Impacto:** Mensagens não chegam aos grupos
**Localização:** `supabase/functions/groups/index.ts:172-191`

**Problema:**
```typescript
// ❌ Tenta enviar para número individual
const evolutionResponse = await fetch(
  `${evolutionApiUrl}/message/sendText/${instanceName}`,
  {
    method: 'POST',
    body: JSON.stringify({
      number: group.whatsapp_id, // ❌ Formato incorreto para grupos
      text: message
    })
  }
)
```

**Solução:**
```typescript
// ✅ Formato correto para grupos
const evolutionResponse = await fetch(
  `${evolutionApiUrl}/message/sendText/${instanceName}`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': evolutionApiKey
    },
    body: JSON.stringify({
      number: `${group.whatsapp_id}@g.us`, // ✅ @g.us para grupos
      text: message
    })
  }
)
```

Validar formato do `whatsapp_id`:
```typescript
// Deve ser: 120363xxxxx (sem @g.us no banco)
if (!/^\d{10,15}$/.test(group.whatsapp_id)) {
  throw new Error('ID de grupo inválido')
}
```

**Status:** ❌ NÃO CORRIGIDO

---

### ✅ P22: Auth SignUp Não Implementado
**Severidade:** 🟠 ALTO (UX)
**Impacto:** Não consegue criar novos operadores pela UI
**Localização:** `src/store/useAuthStore.ts:93-100`
**Status:** ✅ RESOLVIDO (2026-02-10)

**Problema:**
SignUp estava implementado como mock, retornando erro "SignUp não implementado".

**Solução Implementada:**

1. **Edge Function** (`supabase/functions/operators/index.ts`):
   - Adicionado endpoint POST `/auth/signup`
   - Cria usuário no Supabase Auth
   - Cria registro na tabela `operators` com permissões padrão
   - Auto-login após criação bem-sucedida
   - Rollback do auth user se falhar criar operador

2. **API Client** (`src/lib/apiClient.ts`):
   - Adicionado método `signup(email, password, name, role)`
   - Salva token e usuário no localStorage

3. **Auth Store** (`src/store/useAuthStore.ts`):
   - Implementado signUp real usando api.signup()
   - Toast de sucesso e navegação automática

4. **UI** (`src/pages/Login.tsx`):
   - Campo de "Nome Completo" adicionado no modo cadastro
   - Validação de nome mínimo 3 caracteres
   - Navegação automática após signup bem-sucedido

**Teste:**
1. Acessar /login e clicar em "Solicitar novo acesso"
2. Preencher nome, email e senha
3. Sistema cria conta e faz login automaticamente

~~**Solução:**
Implementar no Edge Function:~~
```typescript
// supabase/functions/operators/index.ts

if (url.pathname.endsWith('/auth/register')) {
  const { email, password, name } = await req.json()

  // Validar
  if (!email || !password || !name) {
    return new Response(JSON.stringify({ error: 'Campos obrigatórios' }), {
      status: 400
    })
  }

  // Criar usuário
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (authError) throw authError

  // Criar operator
  const { data: operator, error: opError } = await supabase
    .from('operators')
    .insert({
      id: authUser.user.id,
      name,
      email,
      role: 'operator',
      permissions: { visualizar: true, editar: false, aprovar: false }
    })
    .select()
    .single()

  if (opError) throw opError

  return new Response(JSON.stringify({ operator }), { status: 201 })
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P10: Token JWT Sem Refresh
**Severidade:** 🟠 ALTO (UX)
**Impacto:** Usuário deslogado sem aviso após 7 dias
**Localização:** `src/lib/apiClient.ts` e `src/store/useAuthStore.ts`

**Problema:**
- Token expira em 7 dias
- Não há detecção de expiração
- Não há refresh automático

**Solução:**
Ver P36 acima (mesmo problema)

**Status:** ❌ NÃO IMPLEMENTADO

---

### P11: Métodos API Não Implementados
**Severidade:** 🟠 ALTO (Bugs)
**Impacto:** Chamadas falham silenciosamente
**Localização:** `src/lib/apiClient.ts`

**Problema:**
Estes métodos são chamados mas não existem:
```typescript
api.autoAdvanceLoad(loadId) // Chamado mas não existe!
api.getCandidates() // Diferente de getCandidatesByLoad
```

**Solução:**
1. Adicionar método faltante:
```typescript
async autoAdvanceLoad(loadId: string) {
  const url = `${SUPABASE_URL}/functions/v1/loads/${loadId}/auto-advance`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getStoredToken()}`,
      'apikey': SUPABASE_ANON_KEY
    }
  })
  return this.handleResponse(response, 'autoAdvanceLoad')
}
```

2. Remover chamadas a `getCandidates()` ou implementar

**Status:** ❌ NÃO IMPLEMENTADO

---

## 🟡 MÉDIO - Qualidade e UX

### P1: Falta Validação de Inputs
**Severidade:** 🟡 MÉDIO (Qualidade)
**Impacto:** Dados inválidos no banco
**Localização:** Todos os formulários

**Problema:**
Nenhum formulário valida:
- Campos obrigatórios
- Formatos (email, telefone, CPF)
- Tamanhos mínimos/máximos

**Solução:**
```bash
npm install react-hook-form zod @hookform/resolvers
```

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const cardSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(255),
  origin: z.string().min(1, 'Origem obrigatória'),
  destination: z.string().min(1, 'Destino obrigatório'),
  value: z.string().regex(/^\d+(\.\d{2})?$/, 'Valor inválido'),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(cardSchema)
})
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P6: Stores Sem Persistência
**Severidade:** 🟡 MÉDIO (UX)
**Impacto:** Estado perdido ao recarregar
**Localização:** Todos os Zustand stores

**Problema:**
```typescript
// useKanbanStore.ts
export const useKanbanStore = create<KanbanStore>()((set, get) => ({
  // ❌ Sem persist
}))
```

**Solução:**
```typescript
import { persist } from 'zustand/middleware'

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set, get) => ({
      // ... estado
    }),
    {
      name: 'kanban-storage',
      partialize: (state) => ({
        // Escolher o que persistir
        searchTerm: state.searchTerm,
        activeTab: state.activeTab,
        isCompactMode: state.isCompactMode,
        // Não persistir cards (vem do backend)
      })
    }
  )
)
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P30: Sem Paginação
**Severidade:** 🟡 MÉDIO (Performance)
**Impacto:** Lentidão com muitas cargas
**Localização:** `src/store/useKanbanStore.ts:93`

**Problema:**
```typescript
fetchCards: async () => {
  const response = await api.getLoads()
  // ❌ Carrega TODAS as cargas de uma vez
}
```

**Solução:**
```typescript
// Backend já aceita limit/offset
fetchCards: async (limit = 50, offset = 0) => {
  const response = await api.getLoads(limit, offset)
  set({ cards: response.loads, totalCards: response.total })
}

// Infinite scroll no frontend
const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
    const { cards, totalCards } = get()
    if (cards.length < totalCards) {
      fetchCards(50, cards.length) // Carregar mais
    }
  }
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P27: Status vs Column ID Inconsistente
**Severidade:** 🟡 MÉDIO (Dados)
**Impacto:** Confusão, possível inconsistência
**Localização:** Tabela `loads`

**Problema:**
```typescript
// Duas representações do estado:
load.status = 'registration'
load.column_id = 'registration'
// ❌ Qual é a fonte da verdade?
```

**Solução:**
Escolher UM campo:
1. Remover `status`, usar apenas `column_id`
2. Ou fazer `status` derivado de `column_id`
3. Ou sincronizar sempre ambos

**Status:** ⚠️ Decisão arquitetural necessária

---

### P28: Broadcast Status Reset Inconsistente
**Severidade:** 🟡 MÉDIO (Lógica)
**Impacto:** Perda de histórico
**Localização:** `src/store/useKanbanStore.ts:161-178`

**Problema:**
```typescript
const shouldResetBroadcast =
  toColumnId === 'registration' || toColumnId === 'broadcast'

if (shouldResetBroadcast) {
  updateData.broadcast_status = 'pending'
}
// ❌ Se mover para 'initial_service', não reseta
// ❌ Se voltar para 'registration', perde histórico
```

**Solução:**
```typescript
// Não resetar, manter histórico
// Adicionar timestamp de quando foi enviado
updateData.broadcast_sent_at = toColumnId === 'broadcast'
  ? new Date().toISOString()
  : updateData.broadcast_sent_at
```

**Status:** ❌ NÃO CORRIGIDO

---

### P29: Race Condition Auto-Advance vs Drag Manual
**Severidade:** 🟡 MÉDIO (Bugs)
**Impacto:** Estado inconsistente
**Localização:** `src/store/useKanbanStore.ts`

**Problema:**
1. Usuário arrasta card de A → B
2. Auto-advance move card de A → C simultaneamente
3. Qual estado vence?

**Solução:**
```typescript
let isAutoAdvancing = false

moveCard: async (cardId, toColumnId) => {
  if (isAutoAdvancing) {
    toast.warning('Aguarde o auto-advance terminar')
    return
  }
  // ... mover card
}

autoAdvanceCard: async (cardId) => {
  isAutoAdvancing = true
  try {
    // ... auto-advance
  } finally {
    isAutoAdvancing = false
  }
}
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P31: Kanban Re-renderiza Desnecessariamente
**Severidade:** 🟡 BAIXO (Performance)
**Impacto:** Lentidão perceptível com muitos cards
**Localização:** `src/components/kanban/Board.tsx:65-69`

**Problema:**
```typescript
const filteredCards = cards.filter(card =>
  card.title.toLowerCase().includes(searchTerm.toLowerCase())
  // ❌ Recalcula a cada render
)
```

**Solução:**
```typescript
const filteredCards = useMemo(() =>
  cards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  ),
  [cards, searchTerm] // ✅ Só recalcula se mudar
)
```

**Status:** ❌ NÃO OTIMIZADO

---

### P32: Mapbox Carrega Todas as Cargas Sem Clustering
**Severidade:** 🟡 MÉDIO (Performance)
**Impacto:** Mapa lento com muitas cargas
**Localização:** `src/components/map/RouteMap.tsx`

**Problema:**
- Carrega todas as coordenadas no mapa
- Sem clustering de markers
- Sem lazy loading

**Solução:**
```typescript
import mapboxgl from 'mapbox-gl'

// Usar clustering
map.addSource('loads', {
  type: 'geojson',
  data: geojsonData,
  cluster: true,
  clusterMaxZoom: 14,
  clusterRadius: 50
})

map.addLayer({
  id: 'clusters',
  type: 'circle',
  source: 'loads',
  filter: ['has', 'point_count'],
  paint: {
    'circle-radius': [
      'step',
      ['get', 'point_count'],
      20, 100, 30, 750, 40
    ]
  }
})
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P2: Error Boundaries Ausentes
**Severidade:** 🟡 MÉDIO (UX)
**Impacto:** Crash completo da app
**Localização:** Todos os componentes

**Problema:**
- Nenhum error boundary
- Erro em um componente derruba toda a aplicação

**Solução:**
```typescript
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('Error boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}

// App.tsx
<ErrorBoundary>
  <Dashboard />
</ErrorBoundary>
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P3: Acessibilidade Incompleta
**Severidade:** 🟡 BAIXO (A11y)
**Impacto:** Dificulta uso por PcD
**Localização:** Vários componentes

**Problemas:**
- Faltam labels ARIA
- Navegação por teclado incompleta
- Sem anúncios para leitores de tela

**Solução:**
```typescript
// Adicionar ARIA labels
<button
  aria-label="Fechar modal"
  aria-describedby="modal-description"
>
  <X />
</button>

// Navegação por teclado
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeModal()
  if (e.key === 'Enter') submitForm()
}

// Live regions
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

**Status:** ⚠️ Parcialmente implementado (Radix UI ajuda)

---

### P5: Stores Duplicadas
**Severidade:** 🟡 BAIXO (Refactor)
**Impacto:** Confusão, código duplicado
**Localização:** `src/store/`

**Problema:**
```
useOperatorStore.ts (singular)
useOperatorsStore.ts (plural)
```

Parecem redundantes. Qual usar?

**Solução:**
1. Revisar ambas
2. Mesclar se duplicadas
3. Ou renomear para clarificar diferença

**Status:** ⚠️ Investigação necessária

---

### P7: Sem Tratamento de 404
**Severidade:** 🟡 BAIXO (UX)
**Impacto:** Redireciona para Dashboard
**Localização:** `src/App.tsx`

**Problema:**
```typescript
<Routes>
  {/* ... rotas */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

**Solução:**
```typescript
<Route path="*" element={<NotFound />} />
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P8: Sem Lazy Loading de Rotas
**Severidade:** 🟡 MÉDIO (Performance)
**Impacto:** Bundle inicial grande
**Localização:** `src/App.tsx`

**Problema:**
```typescript
import Dashboard from '@/pages/Dashboard'
import DriversList from '@/pages/drivers/DriversList'
// ❌ Tudo no bundle inicial
```

**Solução:**
```typescript
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const DriversList = lazy(() => import('@/pages/drivers/DriversList'))

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</Suspense>
```

**Status:** ❌ NÃO IMPLEMENTADO

---

### P17: React 19 Muito Recente
**Severidade:** 🟡 BAIXO (Estabilidade)
**Impacto:** Possíveis incompatibilidades
**Localização:** `package.json`

**Problema:**
```json
{
  "react": "^19.2.0" // Muito recente
}
```

**Solução:**
- Monitorar issues do React 19
- Testar biblioteca que não atualizaram
- Considerar downgrade para React 18 se problemas

**Status:** ⚠️ Monitorar

---

### P18: Tailwind CSS v4 em Beta
**Severidade:** 🟡 BAIXO (Estabilidade)
**Impacto:** Breaking changes
**Localização:** `package.json`

**Problema:**
```json
{
  "tailwindcss": "^4.1.17" // v4 ainda beta
}
```

**Solução:**
- Fixar versão (sem ^)
- Ou voltar para Tailwind v3 (estável)

**Status:** ⚠️ Monitorar

---

### P20: Build Não-Determinístico
**Severidade:** 🟡 BAIXO (DevOps)
**Impacto:** Cache inválido
**Localização:** `vite.config.ts`

**Problema:**
```typescript
entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`
// ❌ Date.now() = sempre diferente
```

**Solução:**
```typescript
entryFileNames: `assets/[name]-[hash].js`
// ✅ Determinístico
```

**Status:** ❌ NÃO CORRIGIDO

---

### P25: Type Mismatches em Stores
**Severidade:** 🟡 MÉDIO (Tipos)
**Impacto:** Possíveis runtime errors
**Localização:** `src/store/useKanbanStore.ts:224`

**Problema:**
```typescript
if (updatedCard.driver !== undefined)
  dbUpdate.driver_id = typeof updatedCard.driver === 'string'
    ? updatedCard.driver
    : updatedCard.driver?.id

// Mas interface define:
driver?: Driver // Objeto completo
// E backend espera:
driver_id: string // Apenas ID
```

**Solução:**
Padronizar:
```typescript
interface KanbanCard {
  driver_id?: string // ✅ Apenas ID
}

// Fetch com join se precisar do objeto:
const card = await api.getLoad(id) // retorna driver completo
```

**Status:** ⚠️ Revisar tipos

---

### P26: Date Handling Inconsistente
**Severidade:** 🟡 MÉDIO (Dados)
**Impacto:** Bugs de timezone
**Localização:** Vários arquivos

**Problema:**
```typescript
// Frontend:
date: new Date().toLocaleDateString('pt-BR')

// Backend:
created_at: load.created_at.isoformat() if load.created_at else None
```

**Solução:**
Padronizar ISO 8601:
```typescript
// Sempre usar ISO
const date = new Date().toISOString()

// Formatar apenas na exibição
const displayDate = new Date(isoDate).toLocaleDateString('pt-BR')
```

**Status:** ⚠️ Revisar todos os dates

---

### P38: Dados Mock no Código
**Severidade:** 🟡 BAIXO (Qualidade)
**Impacto:** Confusão
**Localização:** `src/store/useDriversStore.ts`

**Problema:**
```typescript
const mockDrivers = [
  { id: '1', name: 'João Silva', ... },
  // ❌ Se banco falhar, mostra dados fake
]
```

**Solução:**
Remover mocks ou usar apenas em dev:
```typescript
if (import.meta.env.DEV && !data) {
  return mockDrivers
}
```

**Status:** ⚠️ Remover ou isolar

---

### P39: Charts com Dados Hardcoded
**Severidade:** 🟡 MÉDIO (Funcionalidade)
**Impacto:** Analytics não reflete realidade
**Localização:** `src/components/dashboard/Charts.tsx`

**Problema:**
```typescript
const mockData = [
  { name: 'Seg', value: 4000 },
  // ❌ Não busca dados reais
]
```

**Solução:**
```typescript
const { data: revenueData } = useQuery({
  queryKey: ['revenue', 'week'],
  queryFn: async () => {
    const response = await api.getRevenueByWeek()
    return response.data
  }
})
```

**Status:** ❌ NÃO IMPLEMENTADO

---

## 📋 Problemas Arquiteturais

### Dois Backends Rodando
**Severidade:** 🔴 CRÍTICO (Arquitetura)
**Impacto:** Inconsistência de dados, confusão

**Problema:**
- Backend 1: Supabase Edge Functions (Deno) - USADO
- Backend 2: FastAPI Python - NÃO USADO

**Solução:**
1. Remover backend Python se não for usado
2. Ou migrar Edge Functions para Python
3. Documentar decisão

**Status:** ⚠️ Decisão necessária

---

### Schema Inconsistente (PT vs EN)
**Severidade:** 🔴 ALTO (Dados)
**Impacto:** Confusão, bugs

**Problema:**
Campos duplicados:
- `origem_cidade` vs `origin_city`
- `destino_cidade` vs `destination_city`
- `valor_frete` vs `value` vs `price`

**Solução:**
1. Escolher um idioma (recomendo EN)
2. Migration para padronizar
3. Atualizar todo o código

**Status:** ⚠️ Migration necessária

---

## 📊 Estatísticas

- **Total de Bugs:** 52+
- **Críticos:** 8
- **Altos:** 15
- **Médios:** 29+
- **Status:** 🔴 NÃO PRONTO PARA PRODUÇÃO

---

## 🎯 Prioridades

### Esta Semana (CRÍTICO)
1. P9/P19/P33: Remover credenciais hardcoded
2. P21: Corrigir RLS
3. P34: Sanitização de inputs

### Próximas 2 Semanas (ALTO)
4. P4: Completar auto-advance
5. P12: Edge Function candidates
6. P13: Colunas faltando em loads
7. P23/P24: Configurar WhatsApp
8. P22: Implementar SignUp

### Próximo Mês (MÉDIO)
9. P1: Validação de formulários
10. P6: Persistência de stores
11. P30: Paginação
12. Schema: Padronizar PT/EN
13. Arquitetura: Remover backend duplicado

---

**Última Atualização:** 10 de Fevereiro de 2026
