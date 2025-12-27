# 🚀 Deploy no Vercel - Guia Completo

## 📋 Passos para Deploy

### 1. **Preparar Frontend**
```bash
# Instalar Vercel CLI
npm i -g vercel

# No diretório do projeto
vercel login
vercel --prod
```

### 2. **Configurar Backend no Vercel**
```bash
# No diretório /backend
cd backend
vercel --prod
```

### 3. **Configurar Variáveis de Ambiente**
No painel do Vercel, adicionar:
- `VITE_API_URL`: URL do backend no Vercel
- `DATABASE_URL`: PostgreSQL/Supabase connection string

### 4. **Testar Localmente com Vercel URL**
```bash
# Atualizar .env.local
echo "VITE_API_URL=https://seu-backend.vercel.app" > .env.local
npm run dev
```

## 🔧 Configurações Atuais

✅ **vercel.json** configurado
✅ **Rotas SPA** configuradas  
✅ **Build otimizado** para Vite

## 🐛 Problemas Conhecidos

### "Carga não encontrada" no Vercel
**Causa**: Backend no Vercel não tem os dados de exemplo
**Solução**: 
1. Deploy backend no Vercel
2. Executar migrations no Vercel
3. Criar dados de exemplo via API

### Links de WhatsApp
**Status**: ✅ Funcionando localmente
**Necessário**: Configurar instância WhatsApp no Vercel
