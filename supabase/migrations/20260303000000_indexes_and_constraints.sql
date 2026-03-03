-- Performance indexes for common query patterns

-- Sessions: date-range queries with profile filter (PnL, shifts, reconciliation)
CREATE INDEX IF NOT EXISTS idx_sessions_profile_date ON sessions(profile_id, session_date DESC);

-- KDS orders: active order polling by profile + status queries
CREATE INDEX IF NOT EXISTS idx_kds_orders_profile_created ON kds_orders(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kds_orders_profile_status ON kds_orders(profile_id, status);

-- Tobacco inventory: low-stock cron queries
CREATE INDEX IF NOT EXISTS idx_tobacco_inventory_profile_quantity ON tobacco_inventory(profile_id, quantity_grams) WHERE quantity_grams > 0;

-- Promotions: active promotion date-range lookup
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions(profile_id, valid_from, valid_until) WHERE is_active = true;

-- R2O product mappings: sync lookups
CREATE INDEX IF NOT EXISTS idx_r2o_product_mappings_composite ON r2o_product_mappings(profile_id, r2o_product_id);


-- CHECK constraints for data integrity (idempotent via DO block for PG < 17)
DO $$ BEGIN
  -- Inventory quantities cannot go negative
  ALTER TABLE tobacco_inventory ADD CONSTRAINT chk_quantity_grams_non_negative CHECK (quantity_grams >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bar_inventory ADD CONSTRAINT chk_bar_quantity_non_negative CHECK (quantity >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Bar sales: prices and revenue must be non-negative
DO $$ BEGIN
  ALTER TABLE bar_sales ADD CONSTRAINT chk_unit_price_non_negative CHECK (unit_price >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bar_sales ADD CONSTRAINT chk_total_revenue_non_negative CHECK (total_revenue >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bar_sales ADD CONSTRAINT chk_total_cost_non_negative CHECK (total_cost >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE bar_sales ADD CONSTRAINT chk_margin_percent_valid CHECK (margin_percent IS NULL OR (margin_percent >= -100 AND margin_percent <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Session compatibility scores must be 0-100
DO $$ BEGIN
  ALTER TABLE sessions ADD CONSTRAINT chk_compatibility_score_range CHECK (compatibility_score IS NULL OR (compatibility_score >= 0 AND compatibility_score <= 100));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
