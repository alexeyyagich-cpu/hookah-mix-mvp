-- ready2order POS integration tables

-- Helper function for updated_at trigger (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- READY2ORDER: CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.r2o_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_token TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
  webhook_registered BOOLEAN DEFAULT false,
  product_group_id INTEGER,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.r2o_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own r2o connection" ON public.r2o_connections
  FOR ALL USING (auth.uid() = profile_id);

DROP TRIGGER IF EXISTS update_r2o_connections_updated_at ON public.r2o_connections;
CREATE TRIGGER update_r2o_connections_updated_at
  BEFORE UPDATE ON public.r2o_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- READY2ORDER: PRODUCT MAPPINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.r2o_product_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tobacco_inventory_id UUID REFERENCES public.tobacco_inventory(id) ON DELETE CASCADE NOT NULL,
  r2o_product_id INTEGER NOT NULL,
  r2o_product_name TEXT NOT NULL,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'error')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, tobacco_inventory_id)
);

ALTER TABLE public.r2o_product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own r2o product mappings" ON public.r2o_product_mappings
  FOR ALL USING (auth.uid() = profile_id);

CREATE INDEX IF NOT EXISTS idx_r2o_product_mappings_profile_id ON public.r2o_product_mappings(profile_id);
CREATE INDEX IF NOT EXISTS idx_r2o_product_mappings_r2o_product_id ON public.r2o_product_mappings(r2o_product_id);

-- ============================================================================
-- READY2ORDER: SALES LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.r2o_sales_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  r2o_invoice_id INTEGER NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_timestamp TIMESTAMPTZ NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.r2o_sales_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own r2o sales log" ON public.r2o_sales_log
  FOR ALL USING (auth.uid() = profile_id);

CREATE INDEX IF NOT EXISTS idx_r2o_sales_log_profile_id ON public.r2o_sales_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_r2o_sales_log_created_at ON public.r2o_sales_log(created_at DESC);
