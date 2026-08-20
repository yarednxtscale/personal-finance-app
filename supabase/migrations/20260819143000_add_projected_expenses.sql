create table if not exists public.projected_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid null references public.categories(id) on delete set null,
  account_id uuid null references public.accounts(id) on delete set null,
  name text not null,
  amount numeric not null check (amount >= 0),
  projected_date date not null,
  frequency text not null default 'one_time',
  notes text null,
  is_deleted boolean not null default false,
  deleted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projected_expenses enable row level security;
create policy "projected_expenses_select_own" on public.projected_expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "projected_expenses_insert_own" on public.projected_expenses for insert to authenticated with check (
  (select auth.uid()) = user_id
  and (category_id is null or exists (select 1 from public.categories c where c.id=projected_expenses.category_id and (c.user_id is null or c.user_id=(select auth.uid()))))
  and (account_id is null or exists (select 1 from public.accounts a where a.id=projected_expenses.account_id and a.user_id=(select auth.uid())))
);
create policy "projected_expenses_update_own" on public.projected_expenses for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and (category_id is null or exists (select 1 from public.categories c where c.id=projected_expenses.category_id and (c.user_id is null or c.user_id=(select auth.uid()))))
  and (account_id is null or exists (select 1 from public.accounts a where a.id=projected_expenses.account_id and a.user_id=(select auth.uid())))
);
create policy "projected_expenses_delete_own" on public.projected_expenses for delete to authenticated using ((select auth.uid()) = user_id);
create index if not exists projected_expenses_user_date_idx on public.projected_expenses(user_id, projected_date) where is_deleted=false;
create or replace function public.projected_expenses_set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists projected_expenses_set_updated_at on public.projected_expenses;
create trigger projected_expenses_set_updated_at before update on public.projected_expenses for each row execute function public.projected_expenses_set_updated_at();
drop trigger if exists projected_expenses_trash_archive on public.projected_expenses;
create trigger projected_expenses_trash_archive after update of is_deleted on public.projected_expenses for each row when (new.is_deleted=true and old.is_deleted=false) execute function public.archive_deleted_record();
