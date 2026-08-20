alter table public.transactions
  add column if not exists income_frequency text null;

alter table public.transactions
  drop constraint if exists transactions_income_frequency_check;

alter table public.transactions
  add constraint transactions_income_frequency_check
  check (income_frequency is null or income_frequency in ('monthly','biweekly','other'));

create index if not exists transactions_income_tab_idx
  on public.transactions(user_id, transaction_date desc)
  where type='income' and source_type='income_tab' and is_deleted=false;
