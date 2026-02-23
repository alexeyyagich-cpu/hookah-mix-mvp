-- ============================================================
-- Dashboard Control Panel v1
-- Indexes for performance + single RPC returning all 5 blocks
-- Data tables use profile_id (not organization_id).
-- For org mode we resolve the owner's profile_id via org_members.
-- ============================================================

BEGIN;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sessions_profile_date
  ON public.sessions (profile_id, session_date);

CREATE INDEX IF NOT EXISTS idx_sessions_created_by
  ON public.sessions (created_by);

CREATE INDEX IF NOT EXISTS idx_session_items_session_id
  ON public.session_items (session_id);

CREATE INDEX IF NOT EXISTS idx_bar_sales_profile_sold_at
  ON public.bar_sales (profile_id, sold_at);

CREATE INDEX IF NOT EXISTS idx_inv_tx_profile_created_at
  ON public.inventory_transactions (profile_id, created_at);

-- ============================================================
-- RPC: dashboard_control_snapshot
--
-- Returns JSONB with 5 blocks.
-- All data tables filter by profile_id.
-- For org mode, we look up the owner's user_id from org_members.
-- ============================================================

CREATE OR REPLACE FUNCTION public.dashboard_control_snapshot(
  p_org_id     UUID DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL,
  p_date       DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_today          DATE := COALESCE(p_date, CURRENT_DATE);
  v_yesterday      DATE := v_today - 1;
  v_week_start     DATE := v_today - 7;
  v_is_org         BOOLEAN := p_org_id IS NOT NULL;
  v_owner_id       UUID;  -- the profile_id that owns all data

  -- Block 1
  v_today_grams    NUMERIC := 0;
  v_today_cost     NUMERIC := 0;
  v_yesterday_grams NUMERIC := 0;
  v_week_avg_grams NUMERIC := 0;
  v_week_pct_diff  NUMERIC;

  -- Block 2
  v_target_grams   NUMERIC := 0;
  v_actual_avg     NUMERIC := 0;
  v_overuse_pct    NUMERIC := 0;
  v_today_sessions INTEGER := 0;

  -- Block 5
  v_hookah_rev_today    NUMERIC := 0;
  v_hookah_cost_today   NUMERIC := 0;
  v_hookah_rev_yest     NUMERIC := 0;
  v_bar_rev_today       NUMERIC := 0;
  v_bar_cost_today      NUMERIC := 0;
  v_bar_rev_yest        NUMERIC := 0;

  v_result JSONB;
BEGIN
  -- Auth check for org mode
  IF v_is_org AND NOT public.user_has_org_role(p_org_id, ARRAY['owner','manager','hookah_master','bartender','cook']) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Resolve the data owner profile_id
  -- In org mode: find the owner's user_id (data tables are owned by the org owner)
  -- In solo mode: use the provided p_profile_id
  IF v_is_org THEN
    SELECT om.user_id INTO v_owner_id
    FROM org_members om
    WHERE om.organization_id = p_org_id AND om.role = 'owner'
    LIMIT 1;
    IF v_owner_id IS NULL THEN
      v_owner_id := p_profile_id;  -- fallback
    END IF;
  ELSE
    v_owner_id := p_profile_id;
  END IF;

  -- ======================
  -- BLOCK 1: Tobacco Usage Today
  -- ======================

  SELECT
    COALESCE(SUM(si.grams_used), 0),
    COALESCE(SUM(
      si.grams_used * CASE
        WHEN ti.package_grams > 0 THEN ti.purchase_price / ti.package_grams
        ELSE 0
      END
    ), 0)
  INTO v_today_grams, v_today_cost
  FROM sessions s
  JOIN session_items si ON si.session_id = s.id
  LEFT JOIN tobacco_inventory ti ON ti.id = si.tobacco_inventory_id
  WHERE s.session_date = v_today
    AND s.profile_id = v_owner_id;

  SELECT COALESCE(SUM(si.grams_used), 0)
  INTO v_yesterday_grams
  FROM sessions s
  JOIN session_items si ON si.session_id = s.id
  WHERE s.session_date = v_yesterday
    AND s.profile_id = v_owner_id;

  SELECT COALESCE(SUM(si.grams_used) / NULLIF(7, 0), 0)
  INTO v_week_avg_grams
  FROM sessions s
  JOIN session_items si ON si.session_id = s.id
  WHERE s.session_date >= v_week_start
    AND s.session_date < v_today
    AND s.profile_id = v_owner_id;

  v_week_pct_diff := CASE
    WHEN v_week_avg_grams > 0
    THEN ROUND(((v_today_grams - v_week_avg_grams) / v_week_avg_grams) * 100, 1)
    ELSE NULL
  END;

  -- ======================
  -- BLOCK 2: Avg Grams per Bowl
  -- ======================

  SELECT COALESCE(bt.capacity_grams, 20)
  INTO v_target_grams
  FROM bowl_types bt
  WHERE bt.profile_id = v_owner_id
    AND bt.is_default = true
  LIMIT 1;

  IF v_target_grams IS NULL OR v_target_grams = 0 THEN
    v_target_grams := 20;
  END IF;

  SELECT COALESCE(AVG(s.total_grams), 0), COUNT(*)
  INTO v_actual_avg, v_today_sessions
  FROM sessions s
  WHERE s.session_date = v_today
    AND s.profile_id = v_owner_id;

  v_overuse_pct := CASE
    WHEN v_target_grams > 0 AND v_today_sessions > 0
    THEN ROUND(((v_actual_avg - v_target_grams) / v_target_grams) * 100, 1)
    ELSE 0
  END;

  -- ======================
  -- BLOCK 5: Revenue Snapshot
  -- ======================

  SELECT COALESCE(SUM(s.selling_price), 0)
  INTO v_hookah_rev_today
  FROM sessions s
  WHERE s.session_date = v_today
    AND s.selling_price IS NOT NULL
    AND s.profile_id = v_owner_id;

  v_hookah_cost_today := v_today_cost;

  SELECT COALESCE(SUM(s.selling_price), 0)
  INTO v_hookah_rev_yest
  FROM sessions s
  WHERE s.session_date = v_yesterday
    AND s.selling_price IS NOT NULL
    AND s.profile_id = v_owner_id;

  SELECT COALESCE(SUM(bs.total_revenue), 0),
         COALESCE(SUM(bs.total_cost), 0)
  INTO v_bar_rev_today, v_bar_cost_today
  FROM bar_sales bs
  WHERE bs.sold_at >= v_today::timestamptz
    AND bs.sold_at < (v_today + 1)::timestamptz
    AND bs.profile_id = v_owner_id;

  SELECT COALESCE(SUM(bs.total_revenue), 0)
  INTO v_bar_rev_yest
  FROM bar_sales bs
  WHERE bs.sold_at >= v_yesterday::timestamptz
    AND bs.sold_at < v_today::timestamptz
    AND bs.profile_id = v_owner_id;

  -- ======================
  -- ASSEMBLE RESULT
  -- ======================

  v_result := jsonb_build_object(
    'tobacco_usage', jsonb_build_object(
      'total_grams_today', ROUND(v_today_grams, 1),
      'cost_today', ROUND(v_today_cost, 2),
      'yesterday_grams', ROUND(v_yesterday_grams, 1),
      'week_avg_daily_grams', ROUND(v_week_avg_grams, 1),
      'week_pct_diff', v_week_pct_diff
    ),

    'avg_grams_per_bowl', jsonb_build_object(
      'target_grams', v_target_grams,
      'actual_avg', ROUND(v_actual_avg, 1),
      'overuse_pct', v_overuse_pct,
      'sessions_count', v_today_sessions,
      'status', CASE
        WHEN v_today_sessions = 0 THEN 'no_data'
        WHEN ABS(v_overuse_pct) <= 5 THEN 'green'
        WHEN ABS(v_overuse_pct) <= 15 THEN 'yellow'
        ELSE 'red'
      END
    ),

    'staff_comparison', CASE
      WHEN v_is_org THEN (
        SELECT COALESCE(jsonb_agg(row_data ORDER BY (row_data->>'avg_grams')::numeric DESC NULLS LAST), '[]'::jsonb)
        FROM (
          SELECT jsonb_build_object(
            'user_id', om.user_id,
            'display_name', COALESCE(om.display_name, 'Staff'),
            'role', om.role,
            'sessions_count', COUNT(s.id),
            'total_grams', ROUND(COALESCE(SUM(s.total_grams), 0), 1),
            'avg_grams', ROUND(COALESCE(AVG(s.total_grams), 0), 1)
          ) AS row_data
          FROM org_members om
          LEFT JOIN sessions s
            ON s.created_by = om.user_id
            AND s.session_date = v_today
            AND s.profile_id = v_owner_id
          WHERE om.organization_id = p_org_id
            AND om.is_active = true
            AND om.role IN ('hookah_master', 'manager', 'owner')
          GROUP BY om.user_id, om.display_name, om.role
        ) sub
      )
      ELSE '[]'::jsonb
    END,

    'low_stock_alerts', (
      SELECT COALESCE(jsonb_agg(row_data ORDER BY (row_data->>'estimated_days_left')::numeric ASC NULLS LAST), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', ti.id,
          'brand', ti.brand,
          'flavor', ti.flavor,
          'remaining_grams', ROUND(ti.quantity_grams, 1),
          'low_stock_threshold', COALESCE(ti.low_stock_threshold, 100),
          'avg_daily_usage', ROUND(COALESCE(daily_usage.avg_daily, 0), 2),
          'estimated_days_left', CASE
            WHEN COALESCE(daily_usage.avg_daily, 0) > 0
            THEN ROUND(ti.quantity_grams / daily_usage.avg_daily, 0)
            ELSE NULL
          END
        ) AS row_data
        FROM tobacco_inventory ti
        LEFT JOIN LATERAL (
          SELECT COALESCE(ABS(SUM(it.quantity_grams)) / NULLIF(7, 0), 0) AS avg_daily
          FROM inventory_transactions it
          WHERE it.tobacco_inventory_id = ti.id
            AND it.type = 'session'
            AND it.created_at >= (v_today - 7)::timestamptz
            AND it.created_at < (v_today + 1)::timestamptz
        ) daily_usage ON true
        WHERE ti.profile_id = v_owner_id
          AND ti.quantity_grams < COALESCE(ti.low_stock_threshold, 100)
          AND ti.quantity_grams > 0
      ) sub
    ),

    'revenue_snapshot', jsonb_build_object(
      'hookah_revenue_today', ROUND(v_hookah_rev_today, 2),
      'hookah_cost_today', ROUND(v_hookah_cost_today, 2),
      'hookah_revenue_yesterday', ROUND(v_hookah_rev_yest, 2),
      'bar_revenue_today', ROUND(v_bar_rev_today, 2),
      'bar_cost_today', ROUND(v_bar_cost_today, 2),
      'bar_revenue_yesterday', ROUND(v_bar_rev_yest, 2),
      'combined_revenue_today', ROUND(v_hookah_rev_today + v_bar_rev_today, 2),
      'combined_cost_today', ROUND(v_hookah_cost_today + v_bar_cost_today, 2),
      'combined_revenue_yesterday', ROUND(v_hookah_rev_yest + v_bar_rev_yest, 2),
      'hookah_margin_pct', CASE
        WHEN v_hookah_rev_today > 0
        THEN ROUND(((v_hookah_rev_today - v_hookah_cost_today) / v_hookah_rev_today) * 100, 1)
        ELSE NULL
      END,
      'bar_margin_pct', CASE
        WHEN v_bar_rev_today > 0
        THEN ROUND(((v_bar_rev_today - v_bar_cost_today) / v_bar_rev_today) * 100, 1)
        ELSE NULL
      END,
      'combined_margin_pct', CASE
        WHEN (v_hookah_rev_today + v_bar_rev_today) > 0
        THEN ROUND((((v_hookah_rev_today + v_bar_rev_today) - (v_hookah_cost_today + v_bar_cost_today)) / (v_hookah_rev_today + v_bar_rev_today)) * 100, 1)
        ELSE NULL
      END
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_control_snapshot TO authenticated;

COMMIT;
