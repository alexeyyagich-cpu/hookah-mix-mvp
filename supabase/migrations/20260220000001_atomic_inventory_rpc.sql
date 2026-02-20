-- Atomic inventory decrement to prevent race conditions
-- Uses UPDATE ... SET quantity = GREATEST(0, quantity - $amount) in a single statement

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
  UPDATE public.tobacco_inventory
  SET quantity_grams = GREATEST(0, quantity_grams - p_grams_used),
      updated_at = now()
  WHERE id = p_inventory_id
  RETURNING quantity_grams INTO v_new_quantity;

  RETURN COALESCE(v_new_quantity, -1);
END;
$$;
