-- ============================================================
-- SECURITY BATCH 2: HIGH + MEDIUM SEVERITY FIXES
--
-- H-7: r2o_connections, r2o_product_mappings, r2o_sales_log — split FOR ALL
-- H-8: Split remaining FOR ALL policies (~23 tables)
-- ============================================================

BEGIN;

-- ============================================================
-- H-7: R2O tables — split FOR ALL into per-operation policies
-- ============================================================

-- r2o_connections
DROP POLICY IF EXISTS "Users manage own r2o connection" ON public.r2o_connections;

CREATE POLICY "r2o_conn_select"
  ON public.r2o_connections FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "r2o_conn_insert"
  ON public.r2o_connections FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "r2o_conn_update"
  ON public.r2o_connections FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "r2o_conn_delete"
  ON public.r2o_connections FOR DELETE
  USING (auth.uid() = profile_id);

-- r2o_product_mappings
DROP POLICY IF EXISTS "Users manage own r2o product mappings" ON public.r2o_product_mappings;

CREATE POLICY "r2o_map_select"
  ON public.r2o_product_mappings FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "r2o_map_insert"
  ON public.r2o_product_mappings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "r2o_map_update"
  ON public.r2o_product_mappings FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "r2o_map_delete"
  ON public.r2o_product_mappings FOR DELETE
  USING (auth.uid() = profile_id);

-- r2o_sales_log
DROP POLICY IF EXISTS "Users manage own r2o sales log" ON public.r2o_sales_log;

CREATE POLICY "r2o_log_select"
  ON public.r2o_sales_log FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "r2o_log_insert"
  ON public.r2o_sales_log FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "r2o_log_delete"
  ON public.r2o_sales_log FOR DELETE
  USING (auth.uid() = profile_id);


-- ============================================================
-- H-8 GROUP 1: Financial tables
-- ============================================================

-- bar_inventory
DROP POLICY IF EXISTS "Users manage own bar inventory" ON public.bar_inventory;

CREATE POLICY "bar_inv_select"
  ON public.bar_inventory FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_inv_insert"
  ON public.bar_inventory FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "bar_inv_update"
  ON public.bar_inventory FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_inv_delete"
  ON public.bar_inventory FOR DELETE
  USING (auth.uid() = profile_id);

-- bar_transactions
DROP POLICY IF EXISTS "Users manage own bar transactions" ON public.bar_transactions;

CREATE POLICY "bar_txn_select"
  ON public.bar_transactions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_txn_insert"
  ON public.bar_transactions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "bar_txn_update"
  ON public.bar_transactions FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_txn_delete"
  ON public.bar_transactions FOR DELETE
  USING (auth.uid() = profile_id);

-- bar_sales
DROP POLICY IF EXISTS "Users manage own bar sales" ON public.bar_sales;

CREATE POLICY "bar_sales_select"
  ON public.bar_sales FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_sales_insert"
  ON public.bar_sales FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "bar_sales_update"
  ON public.bar_sales FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_sales_delete"
  ON public.bar_sales FOR DELETE
  USING (auth.uid() = profile_id);

-- marketplace_orders
DROP POLICY IF EXISTS "Users manage own marketplace orders" ON public.marketplace_orders;

CREATE POLICY "mkt_orders_select"
  ON public.marketplace_orders FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "mkt_orders_insert"
  ON public.marketplace_orders FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "mkt_orders_update"
  ON public.marketplace_orders FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "mkt_orders_delete"
  ON public.marketplace_orders FOR DELETE
  USING (auth.uid() = profile_id);

-- marketplace_order_items (join-based via parent order)
DROP POLICY IF EXISTS "Users manage own order items" ON public.marketplace_order_items;

CREATE POLICY "mkt_items_select"
  ON public.marketplace_order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_orders
    WHERE marketplace_orders.id = marketplace_order_items.order_id
      AND marketplace_orders.profile_id = auth.uid()
  ));

CREATE POLICY "mkt_items_insert"
  ON public.marketplace_order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.marketplace_orders
    WHERE marketplace_orders.id = marketplace_order_items.order_id
      AND marketplace_orders.profile_id = auth.uid()
  ));

CREATE POLICY "mkt_items_update"
  ON public.marketplace_order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_orders
    WHERE marketplace_orders.id = marketplace_order_items.order_id
      AND marketplace_orders.profile_id = auth.uid()
  ));

CREATE POLICY "mkt_items_delete"
  ON public.marketplace_order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.marketplace_orders
    WHERE marketplace_orders.id = marketplace_order_items.order_id
      AND marketplace_orders.profile_id = auth.uid()
  ));

-- bonus_transactions
DROP POLICY IF EXISTS "Users can manage own bonus transactions" ON public.bonus_transactions;

CREATE POLICY "bonus_txn_select"
  ON public.bonus_transactions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "bonus_txn_insert"
  ON public.bonus_transactions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "bonus_txn_update"
  ON public.bonus_transactions FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "bonus_txn_delete"
  ON public.bonus_transactions FOR DELETE
  USING (auth.uid() = profile_id);


-- ============================================================
-- H-8 GROUP 2: Multi-tenant tables
-- ============================================================

-- organizations: owner/manager can mutate, all members can read
DROP POLICY IF EXISTS "org_access" ON public.organizations;

CREATE POLICY "org_select"
  ON public.organizations FOR SELECT
  USING (id = ANY(public.user_org_ids()));

CREATE POLICY "org_insert"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "org_update"
  ON public.organizations FOR UPDATE
  USING (public.user_has_org_role(id, ARRAY['owner']));

CREATE POLICY "org_delete"
  ON public.organizations FOR DELETE
  USING (public.user_has_org_role(id, ARRAY['owner']));

-- locations: owner/manager can mutate, all members can read
DROP POLICY IF EXISTS "location_access" ON public.locations;

CREATE POLICY "loc_select"
  ON public.locations FOR SELECT
  USING (organization_id = ANY(public.user_org_ids()));

CREATE POLICY "loc_insert"
  ON public.locations FOR INSERT
  WITH CHECK (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );

CREATE POLICY "loc_update"
  ON public.locations FOR UPDATE
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner', 'manager'])
  );

CREATE POLICY "loc_delete"
  ON public.locations FOR DELETE
  USING (
    public.user_has_org_role(organization_id, ARRAY['owner'])
  );


-- ============================================================
-- H-8 GROUP 3: Bar recipes + ingredients
-- ============================================================

-- bar_recipes
DROP POLICY IF EXISTS "Users manage own bar recipes" ON public.bar_recipes;

CREATE POLICY "bar_recipe_select"
  ON public.bar_recipes FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_recipe_insert"
  ON public.bar_recipes FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "bar_recipe_update"
  ON public.bar_recipes FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "bar_recipe_delete"
  ON public.bar_recipes FOR DELETE
  USING (auth.uid() = profile_id);

-- bar_recipe_ingredients (join-based via parent recipe)
DROP POLICY IF EXISTS "Users manage own recipe ingredients" ON public.bar_recipe_ingredients;

CREATE POLICY "bar_ing_select"
  ON public.bar_recipe_ingredients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bar_recipes
    WHERE bar_recipes.id = bar_recipe_ingredients.recipe_id
      AND bar_recipes.profile_id = auth.uid()
  ));

CREATE POLICY "bar_ing_insert"
  ON public.bar_recipe_ingredients FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bar_recipes
    WHERE bar_recipes.id = bar_recipe_ingredients.recipe_id
      AND bar_recipes.profile_id = auth.uid()
  ));

CREATE POLICY "bar_ing_update"
  ON public.bar_recipe_ingredients FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.bar_recipes
    WHERE bar_recipes.id = bar_recipe_ingredients.recipe_id
      AND bar_recipes.profile_id = auth.uid()
  ));

CREATE POLICY "bar_ing_delete"
  ON public.bar_recipe_ingredients FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.bar_recipes
    WHERE bar_recipes.id = bar_recipe_ingredients.recipe_id
      AND bar_recipes.profile_id = auth.uid()
  ));


-- ============================================================
-- H-8 GROUP 4: Owner-only tables (simple per-op split)
-- ============================================================

-- notification_settings
DROP POLICY IF EXISTS "Users manage own notification settings" ON public.notification_settings;

CREATE POLICY "notif_select" ON public.notification_settings FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "notif_insert" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "notif_update" ON public.notification_settings FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "notif_delete" ON public.notification_settings FOR DELETE USING (auth.uid() = profile_id);

-- saved_mixes
DROP POLICY IF EXISTS "Users manage own saved mixes" ON public.saved_mixes;

CREATE POLICY "mix_select" ON public.saved_mixes FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "mix_insert" ON public.saved_mixes FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "mix_update" ON public.saved_mixes FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "mix_delete" ON public.saved_mixes FOR DELETE USING (auth.uid() = profile_id);

-- auto_reorder_rules
DROP POLICY IF EXISTS "Users manage own auto reorder rules" ON public.auto_reorder_rules;

CREATE POLICY "reorder_select" ON public.auto_reorder_rules FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "reorder_insert" ON public.auto_reorder_rules FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "reorder_update" ON public.auto_reorder_rules FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "reorder_delete" ON public.auto_reorder_rules FOR DELETE USING (auth.uid() = profile_id);

-- email_settings
DROP POLICY IF EXISTS "Users manage own email settings" ON public.email_settings;

CREATE POLICY "email_select" ON public.email_settings FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "email_insert" ON public.email_settings FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "email_update" ON public.email_settings FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "email_delete" ON public.email_settings FOR DELETE USING (auth.uid() = profile_id);

-- telegram_connections
DROP POLICY IF EXISTS "Users manage own telegram connection" ON public.telegram_connections;

CREATE POLICY "tg_select" ON public.telegram_connections FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "tg_insert" ON public.telegram_connections FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "tg_update" ON public.telegram_connections FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "tg_delete" ON public.telegram_connections FOR DELETE USING (auth.uid() = profile_id);

-- floor_tables
DROP POLICY IF EXISTS "Users manage own floor tables" ON public.floor_tables;

CREATE POLICY "floor_select" ON public.floor_tables FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "floor_insert" ON public.floor_tables FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "floor_update" ON public.floor_tables FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "floor_delete" ON public.floor_tables FOR DELETE USING (auth.uid() = profile_id);

-- loyalty_settings
DROP POLICY IF EXISTS "Users can manage own loyalty settings" ON public.loyalty_settings;

CREATE POLICY "loyalty_select" ON public.loyalty_settings FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "loyalty_insert" ON public.loyalty_settings FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "loyalty_update" ON public.loyalty_settings FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "loyalty_delete" ON public.loyalty_settings FOR DELETE USING (profile_id = auth.uid());

-- promotions
DROP POLICY IF EXISTS "Users can manage own promotions" ON public.promotions;

CREATE POLICY "promo_select" ON public.promotions FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "promo_insert" ON public.promotions FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "promo_update" ON public.promotions FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "promo_delete" ON public.promotions FOR DELETE USING (profile_id = auth.uid());

-- push_subscriptions
DROP POLICY IF EXISTS "Users can manage own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "push_select" ON public.push_subscriptions FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "push_insert" ON public.push_subscriptions FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "push_update" ON public.push_subscriptions FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "push_delete" ON public.push_subscriptions FOR DELETE USING (profile_id = auth.uid());

-- staff_profiles — split FOR ALL, preserve public SELECT for tipping
DROP POLICY IF EXISTS "Users can manage own staff profiles" ON public.staff_profiles;
-- Keep: "Public can read staff profiles by slug" (FOR SELECT, is_tip_enabled = true)

CREATE POLICY "staff_prof_select" ON public.staff_profiles FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "staff_prof_insert" ON public.staff_profiles FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "staff_prof_update" ON public.staff_profiles FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "staff_prof_delete" ON public.staff_profiles FOR DELETE USING (profile_id = auth.uid());


-- ============================================================
-- H-8 GROUP 5: Already-safe tables (split FOR ALL, keep logic)
-- ============================================================

-- staff_invitations — clean up Day 1 + original policies
DROP POLICY IF EXISTS "Owners manage own invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.staff_invitations;
DROP POLICY IF EXISTS "owner_read_own_invitations" ON public.staff_invitations;

CREATE POLICY "staff_inv_select" ON public.staff_invitations FOR SELECT
  USING (auth.uid() = owner_profile_id);

CREATE POLICY "staff_inv_insert" ON public.staff_invitations FOR INSERT
  WITH CHECK (auth.uid() = owner_profile_id);

CREATE POLICY "staff_inv_update" ON public.staff_invitations FOR UPDATE
  USING (auth.uid() = owner_profile_id);

CREATE POLICY "staff_inv_delete" ON public.staff_invitations FOR DELETE
  USING (auth.uid() = owner_profile_id);

-- kds_orders — split FOR ALL, preserve multi-tenant USING clause
DROP POLICY IF EXISTS "Users manage own kds_orders" ON public.kds_orders;

CREATE POLICY "kds_select"
  ON public.kds_orders FOR SELECT
  USING (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
    OR auth.uid() IN (SELECT p.id FROM public.profiles p WHERE p.owner_profile_id = kds_orders.profile_id)
  );

CREATE POLICY "kds_insert"
  ON public.kds_orders FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "kds_update"
  ON public.kds_orders FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
    OR auth.uid() IN (SELECT p.id FROM public.profiles p WHERE p.owner_profile_id = kds_orders.profile_id)
  );

CREATE POLICY "kds_delete"
  ON public.kds_orders FOR DELETE
  USING (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
  );

-- shifts — split FOR ALL, preserve multi-tenant USING clause
DROP POLICY IF EXISTS "Users manage own shifts" ON public.shifts;

CREATE POLICY "shift_select"
  ON public.shifts FOR SELECT
  USING (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
    OR auth.uid() IN (SELECT p.id FROM public.profiles p WHERE p.owner_profile_id = shifts.profile_id)
  );

CREATE POLICY "shift_insert"
  ON public.shifts FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "shift_update"
  ON public.shifts FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "shift_delete"
  ON public.shifts FOR DELETE
  USING (
    profile_id = auth.uid()
    OR profile_id IN (SELECT p.owner_profile_id FROM public.profiles p WHERE p.id = auth.uid())
  );


COMMIT;
