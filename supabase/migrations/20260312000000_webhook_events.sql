-- Webhook events table for retry/dead-letter queue
-- Used by /api/cron/webhook-retry to re-process failed webhook deliveries

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL, -- 'stripe', 'r2o', etc.
  event_type text NOT NULL, -- e.g. 'invoice.created', 'checkout.session.completed'
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'failed' CHECK (status IN ('failed', 'resolved', 'dead')),
  retry_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cron retry queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_status_retry
  ON webhook_events (status, retry_count)
  WHERE status = 'failed';

-- Index for cleanup of old resolved events
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
  ON webhook_events (created_at);

-- RLS: only service role can access (no user access needed)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- No RLS policies = only service_role key can read/write (admin client)
