-- Sync heartbeats table for tracking device sync queue status
-- Used by /api/sync/heartbeat (POST: report) and /api/sync/heartbeat (GET: status)

CREATE TABLE IF NOT EXISTS sync_heartbeats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  pending_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, device_id)
);

-- Index for owner status queries
CREATE INDEX IF NOT EXISTS idx_sync_heartbeats_profile
  ON sync_heartbeats (profile_id, last_seen_at DESC);

-- Cleanup old heartbeats (devices not seen in 30 days)
-- Can be run as a periodic maintenance query
CREATE INDEX IF NOT EXISTS idx_sync_heartbeats_last_seen
  ON sync_heartbeats (last_seen_at);

-- RLS: only service role can access (admin client)
ALTER TABLE sync_heartbeats ENABLE ROW LEVEL SECURITY;
