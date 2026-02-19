-- Staff attribution + guest linking migration
-- Track which staff member created each session
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
-- Link sessions to guest CRM
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL;

-- Track which staff member created each KDS order
ALTER TABLE public.kds_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Indexes for staff attribution queries
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON public.sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_guest_id ON public.sessions(guest_id);
CREATE INDEX IF NOT EXISTS idx_kds_orders_created_by ON public.kds_orders(created_by);
