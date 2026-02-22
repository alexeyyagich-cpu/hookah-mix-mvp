-- ============================================================
-- CRITICAL SECURITY FIXES
-- 1. Add auth + ownership checks to SECURITY DEFINER RPCs
-- 2. Lock down reviews table (was fully open to INSERT)
-- 3. Lock down reservations table (open INSERT + PII-leaking SELECT)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Fix decrement_tobacco_inventory RPC
--    Was: any user (even unauthenticated) could modify ANY inventory
--    Now: requires auth + caller must own the inventory item
-- ============================================================
CREATE OR REPLACE FUNCTION public.decrement_tobacco_inventory(
  p_inventory_id UUID,
  p_grams_used NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_quantity NUMERIC;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only update if caller owns the item
  UPDATE public.tobacco_inventory
  SET quantity_grams = GREATEST(0, quantity_grams - p_grams_used),
      updated_at = now()
  WHERE id = p_inventory_id
    AND profile_id = auth.uid()
  RETURNING quantity_grams INTO v_new_quantity;

  RETURN COALESCE(v_new_quantity, -1);
END;
$$;

-- ============================================================
-- 2. Fix adjust_bar_inventory RPC
--    Same issue: no auth or ownership check
-- ============================================================
CREATE OR REPLACE FUNCTION public.adjust_bar_inventory(
  p_inventory_id UUID,
  p_quantity_change NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_quantity NUMERIC;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only update if caller owns the item
  UPDATE public.bar_inventory
  SET quantity = GREATEST(0, quantity + p_quantity_change),
      updated_at = now()
  WHERE id = p_inventory_id
    AND profile_id = auth.uid()
  RETURNING quantity INTO v_new_quantity;

  RETURN COALESCE(v_new_quantity, -1);
END;
$$;

-- ============================================================
-- 3. Fix reviews table
--    Was: "Anyone can insert reviews" WITH CHECK (true) — fully open
--    Now: require authentication to insert reviews
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;

CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 4. Fix reservations table
-- ============================================================

-- 4a. Drop the fully open INSERT policy
DROP POLICY IF EXISTS "Anyone can insert reservations" ON public.reservations;

-- Require authentication to create reservations
CREATE POLICY "Authenticated users can insert reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4b. Drop the PII-leaking public SELECT policy
--     Was: anyone could read guest_name, guest_phone for all pending/confirmed
DROP POLICY IF EXISTS "Public view reservation slots" ON public.reservations;

-- Replace with a safe RPC that only returns availability info (no PII)
CREATE OR REPLACE FUNCTION public.get_reservation_slots(
  p_profile_id UUID,
  p_date DATE
)
RETURNS TABLE (
  reservation_date DATE,
  reservation_time TIME,
  duration_minutes INTEGER,
  guest_count INTEGER,
  status TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT r.reservation_date, r.reservation_time, r.duration_minutes, r.guest_count, r.status
  FROM public.reservations r
  WHERE r.profile_id = p_profile_id
    AND r.reservation_date = p_date
    AND r.status IN ('pending', 'confirmed');
$$;

COMMIT;
