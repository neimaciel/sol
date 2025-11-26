-- Add whatsapp_id column to groups table if it doesn't exist
ALTER TABLE groups ADD COLUMN IF NOT EXISTS whatsapp_id TEXT;

-- Update existing groups with some dummy or real IDs if known
-- UPDATE groups SET whatsapp_id = '120363048567890@g.us' WHERE name = 'Grupo Exemplo';
