-- Finance Hub schema hardening applied to production Supabase.
-- Safe account-link behavior, RLS role hygiene, transaction account nullability support,
-- duplicate trigger cleanup, and redundant index cleanup.

ALTER TABLE public.bills DROP CONSTRAINT IF EXISTS bills_account_id_fkey;
ALTER TABLE public.bills
  ADD CONSTRAINT bills_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.savings_goals DROP CONSTRAINT IF EXISTS savings_goals_account_id_fkey;
ALTER TABLE public.savings_goals
  ADD CONSTRAINT savings_goals_account_id_fkey
  FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_to_account_id_fkey;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_to_account_id_fkey
  FOREIGN KEY (to_account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS notification_preferences_self ON public.notification_preferences;
CREATE POLICY notification_preferences_self ON public.notification_preferences
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS recurring_rules_self ON public.recurring_rules;
CREATE POLICY recurring_rules_self ON public.recurring_rules
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS user_settings_self ON public.user_settings;
CREATE POLICY user_settings_self ON public.user_settings
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS audit_log_self_read ON public.audit_log;
CREATE POLICY audit_log_self_read ON public.audit_log
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS transactions_insert_own ON public.transactions;
CREATE POLICY transactions_insert_own ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
    AND ((account_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = transactions.account_id AND a.user_id = (SELECT auth.uid())
    ))
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = transactions.category_id
        AND (c.user_id IS NULL OR c.user_id = (SELECT auth.uid()))
    )
    AND ((to_account_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.accounts a2
      WHERE a2.id = transactions.to_account_id AND a2.user_id = (SELECT auth.uid())
    ))
    AND ((bill_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = transactions.bill_id AND b.user_id = (SELECT auth.uid())
    ))
    AND ((goal_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = transactions.goal_id AND g.user_id = (SELECT auth.uid())
    ))
  );

DROP POLICY IF EXISTS transactions_update_own ON public.transactions;
CREATE POLICY transactions_update_own ON public.transactions
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    ((SELECT auth.uid()) = user_id)
    AND ((account_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = transactions.account_id AND a.user_id = (SELECT auth.uid())
    ))
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = transactions.category_id
        AND (c.user_id IS NULL OR c.user_id = (SELECT auth.uid()))
    )
    AND ((to_account_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.accounts a2
      WHERE a2.id = transactions.to_account_id AND a2.user_id = (SELECT auth.uid())
    ))
    AND ((bill_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = transactions.bill_id AND b.user_id = (SELECT auth.uid())
    ))
    AND ((goal_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.savings_goals g
      WHERE g.id = transactions.goal_id AND g.user_id = (SELECT auth.uid())
    ))
  );

DROP TRIGGER IF EXISTS accounts_updated_at ON public.accounts;
DROP TRIGGER IF EXISTS bills_updated_at ON public.bills;
DROP TRIGGER IF EXISTS budgets_updated_at ON public.budgets;
DROP TRIGGER IF EXISTS savings_goals_updated_at ON public.savings_goals;
DROP TRIGGER IF EXISTS transactions_updated_at ON public.transactions;

DROP INDEX IF EXISTS public.bills_user_due_idx;
DROP INDEX IF EXISTS public.transactions_user_id_date_idx;
