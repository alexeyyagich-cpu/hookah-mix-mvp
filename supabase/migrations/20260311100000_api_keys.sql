-- API keys for public REST API (Multi+ tier)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT 'default',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by hash
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash) WHERE is_active = true;

-- RLS: org owners/managers only
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select" ON api_keys FOR SELECT
  USING (user_has_org_role(organization_id, ARRAY['owner', 'manager']));

CREATE POLICY "api_keys_insert" ON api_keys FOR INSERT
  WITH CHECK (user_has_org_role(organization_id, ARRAY['owner', 'manager']));

CREATE POLICY "api_keys_update" ON api_keys FOR UPDATE
  USING (user_has_org_role(organization_id, ARRAY['owner', 'manager']));

CREATE POLICY "api_keys_delete" ON api_keys FOR DELETE
  USING (user_has_org_role(organization_id, ARRAY['owner']));
