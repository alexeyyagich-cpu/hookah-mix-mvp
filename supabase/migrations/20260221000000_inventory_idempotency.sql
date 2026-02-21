-- Inventory transaction idempotency constraints
-- Prevents double deductions from offline sync retries and concurrent devices

-- 1. Prevent duplicate session-based deductions
--    One transaction per (tobacco_inventory_id, session_id, type) for session deductions
CREATE UNIQUE INDEX IF NOT EXISTS idx_inv_tx_session_dedup
  ON public.inventory_transactions (tobacco_inventory_id, session_id, type)
  WHERE session_id IS NOT NULL;

-- 2. Add idempotency_key column for standalone (non-session) adjustments
ALTER TABLE public.inventory_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key UUID;

-- 3. UNIQUE constraint on idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_inv_tx_idempotency
  ON public.inventory_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 4. Composite index for the sync engine idempotency lookup
CREATE INDEX IF NOT EXISTS idx_inv_tx_session_type_lookup
  ON public.inventory_transactions (tobacco_inventory_id, session_id, type)
  WHERE session_id IS NOT NULL AND type = 'session';
