# 🚨 AÇÃO NECESSÁRIA: Rodar Migração SQL

## O Backend está rodando! ✅

Mas as tabelas do banco ainda não foram criadas.

## Passo a Passo para Criar as Tabelas:

### 1. Abra o SQL Editor do Supabase
Clique aqui: https://app.supabase.com/project/lvmzrjkhogfhbbshwfgs/sql/new

### 2. Copie o SQL de Migração
Abra o arquivo: `backend/migrations/001_create_tables.sql`

Ou copie daqui:

```sql
-- Migration: Create tables for AI Freight Matching System

-- 1. Drivers Table
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_phone ON drivers(phone);

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    plate TEXT,
    capacity TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_driver ON vehicles(driver_id);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    state TEXT DEFAULT 'IDLE',
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_state ON conversations(state);

-- 4. Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
CREATE POLICY "Service role can do everything on drivers"
    ON drivers FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on vehicles"
    ON vehicles FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on conversations"
    ON conversations FOR ALL
    USING (auth.role() = 'service_role');

-- 6. Grant permissions
GRANT ALL ON drivers TO service_role;
GRANT ALL ON vehicles TO service_role;
GRANT ALL ON conversations TO service_role;
GRANT USAGE, SELECT ON SEQUENCE vehicles_id_seq TO service_role;

SELECT 'Migration completed successfully!' AS status;
```

### 3. Cole no SQL Editor e Execute
- Cole TODO o SQL acima
- Clique em **Run** (ou Ctrl+Enter)
- Aguarde a mensagem: "Migration completed successfully!"

### 4. Teste Novamente
Depois de rodar a migração, teste o webhook:

```bash
curl -X POST http://localhost:8000/api/v1/whatsapp/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "data": {
      "messageType": "conversation",
      "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
      "message": {"conversation": "Olá"}
    }
  }'
```

**Resposta esperada**: `{"status":"processed"}`

---

## ✅ Depois da Migração

O backend estará 100% funcional e pronto para:
1. Receber mensagens do WhatsApp
2. Processar com IA (Gemini)
3. Salvar conversas no banco
4. Responder via Evolution API

**Me avise quando terminar a migração para continuarmos!** 🚀
