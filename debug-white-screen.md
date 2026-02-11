# Debug: Tela Branca - Guia de Solução

## Mudanças Recentes (Commit 0acc65e)

Arquivos modificados:
- `src/store/useKanbanStore.ts` - Auto-advance workflow
- `src/components/card/CardModal.tsx` - Botões de rejeição
- `src/lib/schemas.ts` - Correção Zod enums
- `BUGS_LIST.md` - Documentação

## Possíveis Causas da Tela Branca

### 1. Erro de Runtime no useKanbanStore
**Sintoma:** Todas as páginas que usam Kanban (Dashboard) quebradas
**Como verificar:**
```
Abra DevTools (F12) → Console
Procure por: "useKanbanStore", "autoAdvanceLocks", "Set"
```

**Solução rápida:**
```bash
git revert HEAD  # Reverter último commit
npm run dev
```

### 2. Erro nos Schemas Zod
**Sintoma:** Páginas com formulários quebradas (/drivers, /groups)
**Como verificar:**
```
Console → Procure por: "z.enum", "Zod", "validation"
```

### 3. Problema com Set() no navegador antigo
**Sintoma:** "Set is not defined" ou similar
**Como verificar:**
```javascript
// No console do browser:
console.log(typeof Set)  // Deve retornar "function"
```

## Páginas Afetadas (Por Tipo de Erro)

### Se apenas Dashboard está quebrado:
- Problema: `useKanbanStore.ts` (linha 53: autoAdvanceLocks)
- Solução: Ver seção "Rollback do Auto-Advance"

### Se /drivers, /groups, /operators estão quebrados:
- Problema: `schemas.ts` ou `validation.ts`
- Solução: Ver seção "Rollback dos Schemas"

### Se TODAS as páginas estão quebradas:
- Problema: Erro no `App.tsx`, `main.tsx`, ou autenticação
- Solução: Ver seção "Rollback Completo"

## Comandos de Rollback

### Rollback Completo (reverter tudo)
```bash
cd "/Users/neimaciel/Documents/S.O.L - DEZEMBRO - AUTO CLAUDE"
git revert HEAD --no-edit
npm run dev
```

### Rollback Parcial (apenas useKanbanStore)
```bash
git checkout HEAD~1 src/store/useKanbanStore.ts
npm run dev
```

### Rollback Parcial (apenas schemas)
```bash
git checkout HEAD~1 src/lib/schemas.ts
npm run dev
```

## Como Identificar o Erro Exato

### Passo 1: Abrir DevTools
```
Chrome/Edge: F12 ou Ctrl+Shift+I
Firefox: F12 ou Ctrl+Shift+K
Safari: Cmd+Option+I
```

### Passo 2: Verificar Console
Procure por mensagens de erro vermelhas. Exemplos:

```
❌ "Cannot read property 'add' of undefined"
   → Problema: autoAdvanceLocks não foi inicializado

❌ "z.enum is not a function"
   → Problema: Versão Zod incompatível

❌ "Set is not defined"
   → Problema: Navegador antigo sem suporte a Set

❌ "Failed to fetch" ou "Network Error"
   → Problema: API não está acessível
```

### Passo 3: Verificar Network Tab
```
DevTools → Network → Filtrar por "Fetch/XHR"
Verificar se chamadas para Supabase estão falhando
```

### Passo 4: Testar Página por Página
```
✅ http://localhost:5173/login - Funciona?
✅ http://localhost:5173/ (Dashboard) - Funciona?
✅ http://localhost:5173/drivers - Funciona?
✅ http://localhost:5173/groups - Funciona?
```

## Erros Comuns e Soluções

### Erro 1: "autoAdvanceLocks.add is not a function"
```typescript
// PROBLEMA: Set não inicializado corretamente
// SOLUÇÃO: Verificar linha 89 do useKanbanStore.ts
autoAdvanceLocks: new Set<string>(),  // ← Deve estar assim
```

### Erro 2: "Cannot read property 'has' of undefined"
```typescript
// PROBLEMA: locks não definido no escopo
// SOLUÇÃO: Verificar linha 350 do useKanbanStore.ts
const locks = get().autoAdvanceLocks  // ← Deve pegar do state
```

### Erro 3: Tela branca sem erro no console
```bash
# PROBLEMA: Erro silencioso de build
# SOLUÇÃO: Forçar rebuild limpo
rm -rf node_modules/.vite
npm run dev
```

## Teste Manual Rápido

Abra o Console do DevTools e cole:

```javascript
// Teste 1: Verificar se store está acessível
console.log(window.useKanbanStore)

// Teste 2: Verificar estado inicial
const state = window.useKanbanStore.getState()
console.log('Locks:', state.autoAdvanceLocks)

// Teste 3: Verificar se Set funciona
const testSet = new Set()
testSet.add('test')
console.log('Set works:', testSet.has('test'))
```

## Próximos Passos

1. **URGENTE:** Identifique qual(is) página(s) está(ão) quebrada(s)
2. Copie a mensagem de erro EXATA do console
3. Execute o teste manual acima
4. Compartilhe os resultados

## Contato com o Debug
Se precisar reverter rapidamente:
```bash
git revert HEAD --no-edit && npm run dev
```

Isso restaura o sistema ao estado anterior sem perder o histórico.
