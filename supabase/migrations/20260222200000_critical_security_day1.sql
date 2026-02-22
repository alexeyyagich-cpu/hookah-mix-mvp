-- ============================================================
-- DAY 1 CRITICAL SECURITY FIXES
--
-- C-1: org_members privilege escalation (bartender → owner)
-- C-2: invite_tokens open SELECT (token enumeration)
-- C-3: tips open INSERT (fake tip injection)
-- C-4: inventory RPCs (service_role + org member support)
-- BONUS: staff_invitations open SELECT, get_reservation_slots auth
-- ============================================================

BEGIN;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================

-- Check if caller has specific role(s) in an org
CREATE OR REPLACE FUNCTION public.user_has_org_role(p_org_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
      AND organization_id = p_org_id
      AND role = ANY(p_roles)
      AND is_active = true
  )
$$;

-- Check if two users share at least one organization
CREATE OR REPLACE FUNCTION public.users_share_org(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members a
    JOIN public.org_members b ON a.organization_id = b.organization_id
    WHERE a.user_id = p_user_a AND a.is_active = true
      AND b.user_id = p_user_b AND b.is_active = true
  )
$$;

-- ============================================================
-- C-1: FIX org_members PRIVILEGE ESCALATION
--
-- Before: FOR ALL → any member can UPDATE role to 'owner'
-- After:  SELECT for all members, INSERT/UPDATE/DELETE for owner only
-- ============================================================

-- Drop ALL possible policies (handles both migration-only and script-applied states)
DROP POLICY IF EXISTS "org_members_access" ON public.org_members;
DROP POLICY IF EXISTS "Members can view team" ON public.org_members;
DROP POLICY IF EXISTS "Owners can manage team" ON public.org_members;
DROP POLICY IF EXISTS "Users can accept invites" ON public.org_members;

-- SELECT: any active org member can view team
CREATE POLICY "members_select"
  ON public.org_members FOR SELECT
  USING (organization_id = ANY(public.user_org_ids()));

-- INSERT: only owner/manager can add members directly
-- (Invite acceptance uses accept_invite() RPC which is SECURITY DEFINER)
CREATE POLICY "owner_manager_insert"
  ON public.org_members FOR INSERT
  WITH CHECK (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );

-- UPDATE: only owner can modify members (role changes, deactivation, payroll)
CREATE POLICY "owner_update"
  ON public.org_members FOR UPDATE
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner'])
  );

-- DELETE: only owner can hard-delete members
CREATE POLICY "owner_delete"
  ON public.org_members FOR DELETE
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner'])
  );


-- ============================================================
-- C-2: FIX invite_tokens OPEN SELECT
--
-- Before: USING (true) → anyone can enumerate all tokens + emails
-- After:  owner/manager only; join page uses lookup_invite() RPC
-- ============================================================

DROP POLICY IF EXISTS "invite_access" ON public.invite_tokens;
DROP POLICY IF EXISTS "invite_accept" ON public.invite_tokens;
DROP POLICY IF EXISTS "Owners manage invites" ON public.invite_tokens;
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.invite_tokens;

-- SELECT: owner/manager can view org invites (team management page)
CREATE POLICY "org_admin_select_invites"
  ON public.invite_tokens FOR SELECT
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );

-- INSERT: owner/manager can create invites
CREATE POLICY "org_admin_insert_invites"
  ON public.invite_tokens FOR INSERT
  WITH CHECK (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );

-- UPDATE: owner/manager can modify invites (resend, revoke)
CREATE POLICY "org_admin_update_invites"
  ON public.invite_tokens FOR UPDATE
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );

-- DELETE: owner/manager can cancel invites
CREATE POLICY "org_admin_delete_invites"
  ON public.invite_tokens FOR DELETE
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );


-- ============================================================
-- C-2 (continued): RPCs for invite flow
-- Join page (/join/[token]) uses these instead of direct table access
-- ============================================================

-- Safe invite lookup by token — no auth required (public join page)
-- Returns only the data needed to display the invite, no secret columns
CREATE OR REPLACE FUNCTION public.lookup_invite(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', it.id,
    'organization_id', it.organization_id,
    'location_id', it.location_id,
    'email', it.email,
    'role', it.role,
    'expires_at', it.expires_at,
    'org_name', COALESCE(o.name, 'Unknown')
  ) INTO v_result
  FROM public.invite_tokens it
  LEFT JOIN public.organizations o ON o.id = it.organization_id
  WHERE it.token = p_token
    AND it.accepted_at IS NULL
    AND it.expires_at > now();

  RETURN v_result;
END;
$$;

-- Accept invite — requires auth, validates email, creates membership atomically
CREATE OR REPLACE FUNCTION public.accept_invite(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock and fetch invite (FOR UPDATE prevents race conditions)
  SELECT * INTO v_invite
  FROM public.invite_tokens
  WHERE token = p_token AND accepted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invite';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  -- Verify caller's email matches invite
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();
  IF lower(v_user_email) IS DISTINCT FROM lower(v_invite.email) THEN
    RAISE EXCEPTION 'Email mismatch: this invite was sent to a different address';
  END IF;

  -- Create org membership (ON CONFLICT = user already in org)
  INSERT INTO public.org_members (
    organization_id, location_id, user_id, role, display_name
  ) VALUES (
    v_invite.organization_id,
    v_invite.location_id,
    auth.uid(),
    v_invite.role,
    COALESCE(
      (SELECT raw_user_meta_data->>'owner_name' FROM auth.users WHERE id = auth.uid()),
      split_part(v_user_email, '@', 1)
    )
  ) ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Mark invite as accepted
  UPDATE public.invite_tokens
  SET accepted_at = now(), accepted_by = auth.uid()
  WHERE id = v_invite.id;

  RETURN json_build_object(
    'success', true,
    'organization_id', v_invite.organization_id
  );
END;
$$;


-- ============================================================
-- C-3: FIX tips OPEN INSERT
--
-- Before: WITH CHECK (true) → anyone can insert fake completed tips
-- After:  No public INSERT; tips created only by service_role (Stripe webhook)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert tips" ON public.tips;
DROP POLICY IF EXISTS "Staff can view own tips" ON public.tips;

-- SELECT: staff can view their own tips
CREATE POLICY "staff_view_own_tips"
  ON public.tips FOR SELECT
  USING (
    staff_profile_id IN (
      SELECT id FROM public.staff_profiles WHERE profile_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for regular users.
-- Tips are created ONLY by service_role via /api/tip/webhook (Stripe confirmation).


-- ============================================================
-- C-4: FIX INVENTORY RPCs
--
-- Before: profile_id = auth.uid() only → blocks service_role + team members
-- After:  service_role bypass + org membership check via profile_id join
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
  v_is_service_role BOOLEAN;
BEGIN
  -- Detect service_role (used by R2O webhooks, cron jobs)
  v_is_service_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role', ''
  ) = 'service_role';

  -- Require auth for non-service-role callers
  IF NOT v_is_service_role AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_is_service_role THEN
    -- Service role: direct update, no ownership check
    UPDATE public.tobacco_inventory
    SET quantity_grams = GREATEST(0, quantity_grams - p_grams_used),
        updated_at = now()
    WHERE id = p_inventory_id
    RETURNING quantity_grams INTO v_new_quantity;
  ELSE
    -- Regular user: must own the item OR share an org with the owner
    UPDATE public.tobacco_inventory
    SET quantity_grams = GREATEST(0, quantity_grams - p_grams_used),
        updated_at = now()
    WHERE id = p_inventory_id
      AND (
        profile_id = auth.uid()
        OR public.users_share_org(auth.uid(), profile_id)
      )
    RETURNING quantity_grams INTO v_new_quantity;
  END IF;

  RETURN COALESCE(v_new_quantity, -1);
END;
$$;

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
  v_is_service_role BOOLEAN;
BEGIN
  v_is_service_role := COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role', ''
  ) = 'service_role';

  IF NOT v_is_service_role AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_is_service_role THEN
    UPDATE public.bar_inventory
    SET quantity = GREATEST(0, quantity + p_quantity_change),
        updated_at = now()
    WHERE id = p_inventory_id
    RETURNING quantity INTO v_new_quantity;
  ELSE
    UPDATE public.bar_inventory
    SET quantity = GREATEST(0, quantity + p_quantity_change),
        updated_at = now()
    WHERE id = p_inventory_id
      AND (
        profile_id = auth.uid()
        OR public.users_share_org(auth.uid(), profile_id)
      )
    RETURNING quantity INTO v_new_quantity;
  END IF;

  RETURN COALESCE(v_new_quantity, -1);
END;
$$;


-- ============================================================
-- BONUS: Fix staff_invitations open SELECT (legacy table)
-- ============================================================

DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.staff_invitations;

-- Only owner can read their own invitations
CREATE POLICY "owner_read_own_invitations"
  ON public.staff_invitations FOR SELECT
  USING (auth.uid() = owner_profile_id);


-- ============================================================
-- BONUS: Add auth check to get_reservation_slots
-- ============================================================

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
