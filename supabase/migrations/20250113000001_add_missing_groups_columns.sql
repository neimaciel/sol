-- Add missing columns to groups table
-- These columns are used by the frontend but were missing from the schema

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100),
  ADD COLUMN IF NOT EXISTS whatsapp_link TEXT,
  ADD COLUMN IF NOT EXISTS members_count INTEGER DEFAULT 0;

-- Add helpful comment
COMMENT ON COLUMN groups.type IS 'Type of group (e.g., Terceiros, Próprios)';
COMMENT ON COLUMN groups.region IS 'Geographic region (e.g., Curitiba, São Paulo)';
COMMENT ON COLUMN groups.whatsapp_link IS 'WhatsApp invite link';
COMMENT ON COLUMN groups.members_count IS 'Number of members in the group';
