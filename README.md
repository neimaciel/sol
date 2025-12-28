# SOL Logistics - Sistema de Gestão de Cargas

## 🚀 Quick Setup

### 1. Configure Supabase
1. Criar projeto no [Supabase](https://supabase.com)
2. Execute SQL em `supabase/migrations/`:
   - `20241227000001_initial_schema.sql` 
   - `20241227000002_seed_data.sql`

### 2. Deploy Edge Functions
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy loads
supabase functions deploy groups
supabase functions deploy drivers  
supabase functions deploy operators
supabase functions deploy payments
```

### 3. Configure Environment
```bash
# Copy .env.example to .env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Build & Deploy
```bash
npm install
npm run build
# Deploy to Vercel
```

## 📱 URLs After Deploy

- **Admin**: `https://your-app.vercel.app`
- **Public Load**: `https://your-app.vercel.app/load/load-example-1`
- **API**: `https://your-project-id.supabase.co/functions/v1/loads`

## ✅ Test Data Included

- Load: `load-example-1` (working WhatsApp broadcast test)
- Groups: Motoristas SP, Carreteiros RJ
- Drivers: João Santos, Pedro Costa
- Sample payments and operators

## 🔧 Features

- ✅ Responsive UI with contrast improvements
- ✅ WhatsApp broadcast integration
- ✅ Public load viewing for drivers
- ✅ Payment tracking system
- ✅ Supabase Edge Functions backend