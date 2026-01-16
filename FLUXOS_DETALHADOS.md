# Fluxos Detalhados - SOL Logistics

## 🎯 Fluxo Completo de uma Carga

### 1. CADASTRO (Registration)
**Ação:** Operador cria nova carga

```mermaid
sequenceDiagram
    Operador->>CardFormModal: Preenche formulário
    CardFormModal->>Validation: Valida campos obrigatórios
    Validation-->>CardFormModal: Retorna erros ou OK
    CardFormModal->>useKanbanStore: addCard()
    useKanbanStore->>API: POST /loads
    API->>Supabase: INSERT INTO loads
    Supabase-->>API: Carga criada
    API-->>useKanbanStore: { success: true, load }
    useKanbanStore->>Toast: "Carga criada com sucesso!"
    useKanbanStore->>useCardEventsStore: logEvent('created')
```

**Campos Obrigatórios:**
- title (mín 3 caracteres)
- origin (mín 3 caracteres)
- destination (mín 3 caracteres)
- value (número positivo)

**Resultado:**
- Card aparece na coluna "Cadastro"
- Status inicial: `column_id = 'registration'`
- Evento registrado no histórico

---

### 2. DIVULGAÇÃO (Broadcast)
**Ação:** Operador seleciona ou cria grupo WhatsApp

```mermaid
sequenceDiagram
    Operador->>CardModal: Abre modal (tab "Divulgação")
    CardModal->>API: GET /groups
    API-->>CardModal: Lista de grupos
    Operador->>CardModal: Seleciona grupo OU cria novo

    alt Criar Novo Grupo
        CardModal->>API: POST /groups { name, whatsapp_link }
        API->>Evolution API: GET /group/inviteInfo
        Evolution API-->>API: { id, jid }
        API->>Supabase: INSERT INTO groups
        Supabase-->>API: Grupo criado
    end

    CardModal->>useKanbanStore: updateCard({ whatsapp_group_id })
    useKanbanStore->>API: PUT /loads/:id
    API-->>useKanbanStore: Atualizado

    alt Auto-Advance Habilitado
        useKanbanStore->>useKanbanStore: autoAdvanceCard()
        useKanbanStore->>useKanbanStore: moveCard('broadcast')
        Toast->>Operador: "Carga avançada automaticamente"
    end
```

**Condição de Auto-Advance:**
- `whatsapp_group_id` deve estar presente

**Ação Manual:**
- Enviar mensagem para o grupo via Evolution API
- Marcar como `broadcast_status = 'sent'`

---

### 3. ATENDIMENTO (Initial Service)
**Ação:** Motoristas se candidatam, operador analisa

```mermaid
sequenceDiagram
    Motorista->>WhatsApp: Responde à divulgação
    Operador->>Sistema: Registra candidato
    Sistema->>Supabase: INSERT INTO candidates

    Operador->>CardModal: Abre modal (tab "Candidatos")
    CardModal->>useCandidatesStore: fetchCandidates(loadId)
    useCandidatesStore->>API: GET /candidates?load_id=X
    API-->>useCandidatesStore: Lista de candidatos

    Operador->>CandidateList: Seleciona candidato
    CandidateList->>useKanbanStore: assignDriver(cardId, driverId)
    useKanbanStore->>API: PUT /loads/:id { driver_id, column_id: 'documentation' }
    API-->>useKanbanStore: Motorista atribuído

    useKanbanStore->>Toast: "Motorista atribuído com sucesso!"
    useKanbanStore->>useCardEventsStore: logEvent('driver_assigned')
```

**Condição de Auto-Advance:**
- `driver` deve estar atribuído

**Estado após atribuição:**
- Card move para "Documentação"
- Candidato marcado como `selected`

---

### 4. DOCUMENTAÇÃO (Documentation)
**Ação:** Verificar documentos do motorista

```mermaid
sequenceDiagram
    Operador->>CardModal: Abre modal (tab "Documentos")
    CardModal->>CardModal: Exibe checklist

    loop Para cada documento
        Operador->>Sistema: Upload documento
        Sistema->>Supabase Storage: Armazena arquivo
        Supabase Storage-->>Sistema: URL do arquivo
        Sistema->>useKanbanStore: updateCard({ cnh_url/vehicle_doc_url/insurance_url })
    end

    Operador->>CardModal: Marca "Documentos Verificados"
    CardModal->>useKanbanStore: updateCard({ documents_status: 'verified' })

    alt Auto-Advance Habilitado
        useKanbanStore->>useKanbanStore: autoAdvanceCard()
        useKanbanStore->>useKanbanStore: moveCard('risk')
    end
```

**Documentos Obrigatórios:**
- CNH (cnh_url)
- Documento do veículo (vehicle_doc_url)
- Seguro (insurance_url)

**Condição de Auto-Advance:**
- `documents_status = 'verified'`

---

### 5. RISCO (Risk)
**Ação:** Análise de risco da operação

```mermaid
sequenceDiagram
    Operador->>CardModal: Abre modal (tab "Risco")
    CardModal->>CardModal: Exibe formulário de análise

    Operador->>CardModal: Preenche análise
    Note over Operador: Verifica: crédito, histórico, score

    Operador->>CardModal: Aprova/Rejeita
    CardModal->>useKanbanStore: updateCard({ risk_status: 'approved' })

    alt Aprovado + Auto-Advance
        useKanbanStore->>useKanbanStore: moveCard('contract')
        Toast->>Operador: "Avançado para Contrato"
    else Rejeitado
        useKanbanStore->>useKanbanStore: moveCard('registration')
        Toast->>Operador: "Risco rejeitado, carga retornou"
    end
```

**Condição de Auto-Advance:**
- `risk_status = 'approved'`

**Possíveis Status:**
- pending
- approved
- rejected

---

### 6. CONTRATO (Contract)
**Ação:** Gerar e assinar contrato

```mermaid
sequenceDiagram
    Operador->>CardModal: Abre modal (tab "Contrato")
    CardModal->>useContractTemplatesStore: fetchTemplates()
    useContractTemplatesStore-->>CardModal: Lista de templates

    Operador->>CardModal: Seleciona template
    CardModal->>Sistema: Gera contrato com dados da carga
    Sistema->>Sistema: Preenche variáveis {{ }} do template

    Operador->>CardModal: Envia contrato para assinatura
    Note over Operador: Via WhatsApp ou email

    Motorista->>Sistema: Assina contrato (externo)

    Operador->>CardModal: Upload contrato assinado
    CardModal->>Supabase Storage: Armazena PDF
    Supabase Storage-->>CardModal: contract_url
    CardModal->>useKanbanStore: updateCard({ contract_url, contract_signed_at })

    alt Auto-Advance Habilitado
        useKanbanStore->>useKanbanStore: moveCard('loading')
    end
```

**Condição de Auto-Advance:**
- `contract_url` presente

**Templates Disponíveis:**
- Contrato de Frete Lotação
- Contrato de Frete Fracionado
- Contrato com Agregado

---

### 7. CARREGAMENTO (Loading)
**Ação:** Registrar check-in de carregamento

```mermaid
sequenceDiagram
    Motorista->>WhatsApp: Avisa início do carregamento
    Operador->>CardModal: Abre modal (tab "Carregamento")

    Operador->>CardModal: Clica "Registrar Check-in"
    CardModal->>useKanbanStore: updateCard({ checkin_time: new Date() })
    useKanbanStore->>API: PUT /loads/:id
    API-->>useKanbanStore: Atualizado

    useKanbanStore->>Toast: "Check-in registrado!"
    useKanbanStore->>useCardEventsStore: logEvent('check-in')

    alt Auto-Advance Habilitado
        useKanbanStore->>useKanbanStore: moveCard('transit')
    end
```

**Condição de Auto-Advance:**
- `checkin_time` presente

**Informações Registradas:**
- Data/hora do check-in
- Localização (se disponível)
- Foto do carregamento (opcional)

---

### 8. EM TRÂNSITO (Transit)
**Ação:** Monitorar carga em rota

```mermaid
sequenceDiagram
    Sistema->>CardModal: Exibe rastreamento (tab "Trânsito")

    loop Atualizações periódicas
        Motorista->>WhatsApp: Envia localização
        Operador->>Sistema: Registra checkpoint
        Sistema->>useKanbanStore: updateCard({ checkpoints })
    end

    Motorista->>WhatsApp: "Cheguei no destino"
    Operador->>CardModal: Registra chegada
    CardModal->>useKanbanStore: updateCard({ arrival_time: new Date() })

    alt Auto-Advance Habilitado
        useKanbanStore->>useKanbanStore: moveCard('unloading')
    end
```

**Condição de Auto-Advance:**
- `arrival_time` presente

**Monitoramento:**
- Status da viagem
- ETA (tempo estimado de chegada)
- Desvios de rota
- Paradas não programadas

---

### 9. DESCARGA (Unloading)
**Ação:** Confirmar entrega e obter POD

```mermaid
sequenceDiagram
    Motorista->>WhatsApp: Envia comprovante de entrega
    Operador->>CardModal: Abre modal (tab "Descarga")

    Operador->>CardModal: Upload POD (Proof of Delivery)
    CardModal->>Supabase Storage: Armazena arquivo
    Supabase Storage-->>CardModal: pod_url

    CardModal->>useKanbanStore: updateCard({ pod_url, delivered_at })
    useKanbanStore->>Toast: "POD registrado!"

    alt Auto-Advance Habilitado
        useKanbanStore->>useKanbanStore: moveCard('completed')
    end
```

**Condição de Auto-Advance:**
- `pod_url` presente

**POD (Proof of Delivery):**
- Foto do canhoto assinado
- Nota fiscal conferida
- Protocolo de recebimento

---

### 10. FINALIZADO (Completed)
**Ação:** Processar pagamento ao motorista

```mermaid
sequenceDiagram
    Operador->>CardModal: Abre modal (tab "Pagamento")
    CardModal->>usePaymentsStore: fetchPayment(loadId)
    usePaymentsStore->>API: GET /payments?load_id=X

    alt Pagamento não existe
        Operador->>PaymentModal: Clica "Criar Pagamento"
        PaymentModal->>usePaymentsStore: createPayment(loadId, driverId, amount)
        usePaymentsStore->>API: POST /payments
        API->>Supabase: INSERT INTO payments { status: 'PENDING' }
        API-->>usePaymentsStore: Payment criado
        usePaymentsStore->>Toast: "Pagamento criado!"
    end

    Operador->>Sistema: Realiza pagamento (PIX/TED/Boleto)

    Operador->>PaymentModal: Upload comprovante
    PaymentModal->>Supabase Storage: Armazena comprovante
    Supabase Storage-->>PaymentModal: receipt_url

    PaymentModal->>usePaymentsStore: confirmManualPayment(paymentId, notes, receipt_url)
    usePaymentsStore->>API: PUT /payments/:id { status: 'MANUAL_CONFIRMED' }
    API-->>usePaymentsStore: Confirmado

    usePaymentsStore->>Toast: "Pagamento confirmado!"
    useKanbanStore->>useCardEventsStore: logEvent('payment_confirmed')
    useKanbanStore->>useHistoryStore: Mover para histórico
```

**Status de Pagamento:**
- PENDING - Aguardando pagamento
- PROCESSING - Em processamento
- MANUAL_CONFIRMED - Confirmado manualmente
- COMPLETED - Pago automaticamente
- FAILED - Falhou

**Fim do Ciclo:**
- Carga permanece em "Finalizado"
- Pode ser arquivada manualmente
- Dados movidos para relatórios

---

## 🔄 Fluxo de Auto-Advance

### Decisão de Avanço Automático

```typescript
// useKanbanStore.ts - autoAdvanceCard()

const transitions: Record<string, TransitionRule> = {
  'registration': {
    next: 'broadcast',
    condition: () => !!card.whatsapp_group_id
  },
  'broadcast': {
    next: 'initial_service',
    condition: () => card.broadcast_status === 'sent'
  },
  'initial_service': {
    next: 'documentation',
    condition: () => !!card.driver
  },
  'documentation': {
    next: 'risk',
    condition: () => card.documents_status === 'verified'
  },
  'risk': {
    next: 'contract',
    condition: () => card.risk_status === 'approved'
  },
  'contract': {
    next: 'loading',
    condition: () => !!card.contract_url
  },
  'loading': {
    next: 'transit',
    condition: () => !!card.checkin_time
  },
  'transit': {
    next: 'unloading',
    condition: () => !!card.arrival_time
  },
  'unloading': {
    next: 'completed',
    condition: () => !!card.pod_url
  }
}

// Verificar condição e avançar
if (card.auto_advance && transition.condition()) {
  await moveCard(cardId, transition.next)
  toast.success(`Avançado para ${transition.next}`)
}
```

### Triggers de Auto-Advance

O auto-advance pode ser acionado por:
1. **Atualização de campo** - updateCard()
2. **Atribuição de motorista** - assignDriver()
3. **Upload de arquivo** - contract_url, pod_url, etc.
4. **Mudança de status** - broadcast_status, risk_status, etc.

---

## 👤 Fluxo de Autenticação

### Login

```mermaid
sequenceDiagram
    Usuário->>LoginPage: Preenche email/senha
    LoginPage->>useAuthStore: signIn(email, password)
    useAuthStore->>API: POST /operators/auth/login
    API->>Supabase: SELECT FROM operators WHERE email
    API->>API: Verifica senha (bcrypt)

    alt Credenciais válidas
        API->>API: Gera JWT token
        API-->>useAuthStore: { success, operator, token }
        useAuthStore->>LocalStorage: Salva token
        useAuthStore->>Toast: "Login realizado com sucesso!"
        useAuthStore->>Router: Navigate('/kanban')
    else Credenciais inválidas
        API-->>useAuthStore: { error: "Credenciais inválidas" }
        useAuthStore->>Toast: "Erro ao fazer login"
    end
```

### Verificação de Sessão (ao carregar app)

```mermaid
sequenceDiagram
    App->>useAuthStore: initialize()
    useAuthStore->>LocalStorage: api.getToken()

    alt Token existe
        useAuthStore->>API: GET /operators/auth/me
        API->>API: Valida JWT

        alt Token válido
            API-->>useAuthStore: { operator, permissions }
            useAuthStore->>App: Carrega dashboard
        else Token inválido
            API-->>useAuthStore: 401 Unauthorized
            useAuthStore->>LocalStorage: clearToken()
            useAuthStore->>Router: Navigate('/login')
        end
    else Sem token
        useAuthStore->>Router: Navigate('/login')
    end
```

### Logout

```mermaid
sequenceDiagram
    Usuário->>Header: Clica "Sair"
    Header->>useAuthStore: signOut()
    useAuthStore->>API: POST /operators/auth/logout
    API->>Supabase: Revoga token (se necessário)
    useAuthStore->>LocalStorage: clearToken()
    useAuthStore->>Toast: "Logout realizado!"
    useAuthStore->>Router: Navigate('/login')
```

---

## 📱 Fluxo de Notificações Toast

### Quando Usar Toast

```typescript
// ✅ Sucesso em operações
toast.success('Carga criada com sucesso!')
toast.success('Motorista atribuído!')
toast.success('Pagamento confirmado!')

// ❌ Erros em operações
toast.error('Erro ao criar carga')
toast.error('Falha na conexão')
toast.error('Validação falhou')

// ⚠️ Avisos importantes
toast.warning('Documentos pendentes')
toast.warning('Prazo próximo do vencimento')

// ℹ️ Informações
toast.info('Auto-advance habilitado')
toast.info('Sincronizando dados...')
```

### Ciclo de Vida do Toast

```mermaid
sequenceDiagram
    Sistema->>toast.ts: toast.success('Mensagem')
    toast.ts->>toast.ts: Cria elemento DOM
    toast.ts->>Browser: Renderiza notificação
    Browser->>Usuário: Exibe toast (3 segundos)

    alt Usuário clica no toast
        Usuário->>toast.ts: onClick()
        toast.ts->>Browser: Remove toast
    else Auto-dismiss (3s)
        Browser->>toast.ts: Timeout
        toast.ts->>Browser: Remove toast com animação
    end
```

---

## 🔍 Fluxo de Validação

### Validação de Formulário

```mermaid
sequenceDiagram
    Usuário->>Form: Preenche campos
    Form->>Form: onChange atualiza formData

    Usuário->>Form: Submit
    Form->>validation.ts: validateForm(formData, schema)

    loop Para cada campo
        validation.ts->>validation.ts: Valida regra

        alt Campo inválido
            validation.ts->>errors: Adiciona erro
        end
    end

    validation.ts-->>Form: { errors }

    alt Tem erros
        Form->>Form: setErrors(errors)
        Form->>UI: Exibe erros em vermelho
        Form->>Toast: "Corrija os erros no formulário"
    else Sem erros
        Form->>Store: Envia dados
        Store->>API: POST/PUT
    end
```

### Validações Disponíveis

```typescript
// validation.ts - Regras disponíveis

const schema = {
  name: {
    required: true,           // Campo obrigatório
    minLength: 3,            // Mínimo 3 caracteres
    maxLength: 100           // Máximo 100 caracteres
  },
  email: {
    required: true,
    email: true              // Valida formato email
  },
  cpf: {
    required: true,
    cpf: true                // Valida CPF com dígitos verificadores
  },
  cnpj: {
    cnpj: true               // Valida CNPJ
  },
  phone: {
    required: true,
    phone: true              // Valida telefone brasileiro
  },
  value: {
    required: true,
    number: true,            // Valida número
    min: 0                   // Valor mínimo
  },
  whatsappLink: {
    pattern: /^https:\/\/chat\.whatsapp\.com\//  // Regex customizado
  }
}
```

---

## 🎨 Fluxo de Drag & Drop (Kanban)

```mermaid
sequenceDiagram
    Usuário->>KanbanBoard: Arrasta card
    KanbanBoard->>@dnd-kit: onDragStart
    @dnd-kit->>UI: Mostra preview do card

    Usuário->>KanbanBoard: Solta card em nova coluna
    KanbanBoard->>@dnd-kit: onDragEnd
    @dnd-kit-->>KanbanBoard: { active, over }

    KanbanBoard->>useKanbanStore: moveCard(cardId, newColumnId)

    useKanbanStore->>useKanbanStore: Optimistic update
    useKanbanStore->>UI: Atualiza card visualmente

    useKanbanStore->>API: PUT /loads/:id { column_id }

    alt Sucesso
        API-->>useKanbanStore: { success: true }
        useKanbanStore->>useCardEventsStore: logEvent('moved')

        alt Auto-Advance verificado
            useKanbanStore->>Toast: "Verifique condições de avanço"
        end
    else Erro
        API-->>useKanbanStore: { error }
        useKanbanStore->>useKanbanStore: Reverte optimistic update
        useKanbanStore->>useKanbanStore: fetchCards()
        useKanbanStore->>Toast: "Erro ao mover card"
    end
```

---

**Versão:** 1.0.0
**Última atualização:** 2025-01-15
