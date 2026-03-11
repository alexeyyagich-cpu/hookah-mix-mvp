-- Consent logging table for DSGVO compliance
-- Append-only: users can only INSERT and SELECT their own records

CREATE TABLE IF NOT EXISTS consent_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type text NOT NULL, -- 'terms', 'privacy', 'widerruf_waiver', 'cookie'
  version text NOT NULL, -- e.g. '2026-03-01'
  granted boolean NOT NULL DEFAULT true,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Append-only: no UPDATE or DELETE policies
CREATE POLICY "Users can insert own consent" ON consent_log
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can read own consent" ON consent_log
  FOR SELECT USING (auth.uid() = profile_id);

CREATE INDEX idx_consent_log_profile ON consent_log(profile_id);
CREATE INDEX idx_consent_log_type_version ON consent_log(consent_type, version);
