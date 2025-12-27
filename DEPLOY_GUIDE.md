# 🚀 Guia Completo de Deploy - SOL Logistics

## 📋 Pré-requisitos

1. **Conta no Vercel**: https://vercel.com
2. **Conta no Supabase**: https://supabase.com  
3. **Vercel CLI**: `npm i -g vercel`

## 🔧 Passo 1: Configurar Backend

### 1.1 Deploy Backend no Vercel
```bash
cd backend
vercel login
vercel --prod
```

### 1.2 Configurar Variáveis de Ambiente
No painel do Vercel (backend), adicionar:

```env
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_KEY=[ANON_KEY]
EVOLUTION_API_URL=https://evolution-api-instance.com
EVOLUTION_API_KEY=[YOUR_KEY]
INSTANCE_NAME=sol_logistica
```

## 🗄️ Passo 2: Configurar Banco de Dados

### 2.1 Criar Projeto no Supabase
1. Ir para https://supabase.com
2. Criar novo projeto
3. Copiar DATABASE_URL do Settings > Database

### 2.2 Executar Migrations
```bash
# Através da API do backend deployed
curl -X POST https://seu-backend.vercel.app/api/v1/system/migrate
```

### 2.3 Criar Dados de Exemplo
```bash
# Upload do setup_production.py e executar
python setup_production.py
```

## 🌐 Passo 3: Deploy Frontend

### 3.1 Configurar Variáveis
```bash
# .env.local
VITE_API_URL=https://seu-backend.vercel.app
```

### 3.2 Deploy no Vercel
```bash
cd ../ # voltar para root
vercel --prod
```

## 🔗 Passo 4: Testar Sistema Completo

### 4.1 URLs Esperadas
- **Frontend**: https://sol-logistics-ai.vercel.app
- **Backend**: https://seu-backend.vercel.app
- **API Health**: https://seu-backend.vercel.app/health

### 4.2 Teste do Fluxo
1. Acessar frontend
2. Login: admin / admin123  
3. Criar/editar carga
4. Divulgar para grupos
5. Testar link: `/motorista/carga/load-example-1`

## ✅ Checklist de Deploy

- [ ] Backend deployado no Vercel
- [ ] Banco PostgreSQL conectado  
- [ ] Migrations executadas
- [ ] Dados de exemplo criados
- [ ] Frontend deployado
- [ ] Links de motorista funcionando
- [ ] WhatsApp broadcast funcionando

## 🐛 Troubleshooting

### "Carga não encontrada"
- Verificar se migrations rodaram
- Verificar se `load-example-1` existe no banco
- Verificar logs do backend

### "502 Bad Gateway"
- Verificar variáveis de ambiente
- Verificar conexão com banco
- Verificar logs do Vercel

### WhatsApp não funciona
- Verificar Evolution API configurada
- Verificar instância ativa
- Verificar QR Code gerado
