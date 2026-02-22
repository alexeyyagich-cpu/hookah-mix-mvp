-- Atomic bar inventory adjustment to prevent race conditions
-- Mirrors decrement_tobacco_inventory but for bar_inventory table

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
  UPDATE public.bar_inventory
  SET quantity = GREATEST(0, quantity + p_quantity_change),
      updated_at = now()
  WHERE id = p_inventory_id
  RETURNING quantity INTO v_new_quantity;

  RETURN COALESCE(v_new_quantity, -1);
END;
$$;
