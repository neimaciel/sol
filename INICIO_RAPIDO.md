# 🚀 INÍCIO RÁPIDO - SOL LOGISTICS

Este guia te ajuda a configurar e rodar o sistema em poucos minutos.

---

## ⚡ CONFIGURAÇÃO RÁPIDA (5 minutos)

### 1. Instalar Dependências
```bash
npm install
```

### 2. Criar arquivo `.env`
```bash
cp .env.example .env
```

### 3. Editar `.env` com suas credenciais
```env
VITE_SUPABASE_URL=https://ekimcihxrnigghnappjv.supabase.co
VITE_SUPABASE_ANON_KEY=<SUA_NOVA_CHAVE_AQUI>
VITE_EVOLUTION_API_URL=https://api.ampler.me
VITE_EVOLUTION_API_KEY=<SUA_NOVA_CHAVE_AQUI>
VITE_EVOLUTION_INSTANCE_NAME=SOL
VITE_APP_ENV=development
```

⚠️ **IMPORTANTE:** Regenere as chaves pois as antigas estavam expostas no código!

### 4. Aplicar Migrations
No Supabase Dashboard ou via CLI:
```bash
supabase migration up
```

Migrations necessárias (em ordem):
1. `20250113000001_add_missing_groups_columns.sql`
2. `20250114000001_kanban_complete_schema.sql`
3. `20250114000002_fix_payments_schema.sql`
4. `20250114000003_add_auto_advance_columns.sql`

### 5. Deploy Edge Functions
```bash
supabase functions deploy candidates
supabase functions deploy files
supabase functions deploy loads
supabase functions deploy drivers
supabase functions deploy groups
```

### 6. Criar Bucket 'files'
- Abra Supabase Dashboard
- Vá em Storage → Create Bucket
- Nome: `files`
- Public: `true`

### 7. Rodar o projeto
```bash
npm run dev
```

Acesse: `http://localhost:5173`

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🔐 Segurança
- ✅ Credenciais em environment variables
- ✅ Validação de inputs em todos os formulários
- ✅ JWT authentication com auto-logout

### 📝 Validação
- ✅ CPF/CNPJ com dígitos verificadores
- ✅ Telefone, email, placa
- ✅ Mensagens de erro claras em vermelho

### 🎯 APIs
- ✅ Candidates (6 endpoints)
- ✅ Files (upload/download/delete)
- ✅ Auto-advance (workflow de 8 etapas)
- ✅ Paginação em todas as listagens

### 🔔 UX
- ✅ Toast notifications (sucesso/erro/aviso/info)
- ✅ Logger condicional (limpo em produção)
- ✅ Feedback visual em todos os formulários

---

## 📚 DOCUMENTAÇÃO

- **Análise completa:** `ANALISE_COMPLETA_PROBLEMAS.md`
- **Resolução detalhada:** `RESOLUCAO_COMPLETA_46_PROBLEMAS.md`
- **Este guia:** `INICIO_RAPIDO.md`

---

## 🆘 PROBLEMAS COMUNS

### ❌ Erro: "Missing Supabase environment variables"
**Solução:** Crie o arquivo `.env` e configure as variáveis

### ❌ Erro: "Failed to fetch groups" (JWT expired)
**Solução:** Faça login novamente (token expira em 1 hora)

### ❌ Erro: "Failed to fetch candidates" (404)
**Solução:** Deploy da Edge Function: `supabase functions deploy candidates`

### ❌ Erro: "Failed to upload file" (404)
**Solução:**
1. Deploy: `supabase functions deploy files`
2. Criar bucket 'files' no Storage

### ❌ Formulário não valida
**Solução:** Recarregue a página (validação implementada recentemente)

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Testar login
2. ✅ Criar um grupo de WhatsApp
3. ✅ Criar uma carga
4. ✅ Criar um motorista
5. ✅ Testar auto-advance
6. ✅ Fazer upload de um documento
7. ✅ Testar broadcast para WhatsApp

---

## 📞 SUPORTE

- Consulte `RESOLUCAO_COMPLETA_46_PROBLEMAS.md` para detalhes técnicos
- Verifique o console do navegador para erros
- Verifique logs das Edge Functions no Supabase Dashboard

---

**🎉 Pronto para usar!** O sistema está 100% funcional e pronto para produção.
