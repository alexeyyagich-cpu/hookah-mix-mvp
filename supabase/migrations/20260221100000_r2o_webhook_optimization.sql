-- Add r2o_account_id and webhook_id to r2o_connections
-- Enables direct webhook→profile matching and proper webhook cleanup on disconnect

ALTER TABLE public.r2o_connections
  ADD COLUMN IF NOT EXISTS r2o_account_id TEXT,
  ADD COLUMN IF NOT EXISTS webhook_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_r2o_conn_account_id
  ON public.r2o_connections (r2o_account_id)
  WHERE r2o_account_id IS NOT NULL;
