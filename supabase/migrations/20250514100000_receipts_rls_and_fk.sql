-- Run once in Supabase → SQL Editor.
-- Your project has: public.receipts, public.invoices, public.bill_audits
-- This aligns bill_audits → receipts and opens RLS for API keys (anon / authenticated).
--
-- If "add constraint" fails: delete orphan rows in bill_audits whose bill_id is missing from receipts, then re-run.
-- For production: prefer SUPABASE_SERVICE_ROLE_KEY on the server only, then replace these permissive policies.

-- ---------------------------------------------------------------------------
-- Foreign key: bill_audits.bill_id → receipts.bill_id
-- ---------------------------------------------------------------------------
alter table public.bill_audits drop constraint if exists bill_audits_bill_id_fkey;

alter table public.bill_audits
  add constraint bill_audits_bill_id_fkey
  foreign key (bill_id) references public.receipts (bill_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.receipts to anon, authenticated, service_role;
grant select, insert, update, delete on table public.invoices to anon, authenticated, service_role;
grant select, insert, update, delete on table public.bill_audits to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RLS (required for PostgREST when using publishable/anon key without service role)
-- ---------------------------------------------------------------------------
alter table public.receipts enable row level security;
alter table public.invoices enable row level security;
alter table public.bill_audits enable row level security;

drop policy if exists "receipts_all_anon" on public.receipts;
drop policy if exists "receipts_all_authenticated" on public.receipts;
drop policy if exists "invoices_all_anon" on public.invoices;
drop policy if exists "invoices_all_authenticated" on public.invoices;
drop policy if exists "bill_audits_all_anon" on public.bill_audits;
drop policy if exists "bill_audits_all_authenticated" on public.bill_audits;

create policy "receipts_all_anon"
  on public.receipts for all to anon using (true) with check (true);

create policy "receipts_all_authenticated"
  on public.receipts for all to authenticated using (true) with check (true);

create policy "invoices_all_anon"
  on public.invoices for all to anon using (true) with check (true);

create policy "invoices_all_authenticated"
  on public.invoices for all to authenticated using (true) with check (true);

create policy "bill_audits_all_anon"
  on public.bill_audits for all to anon using (true) with check (true);

create policy "bill_audits_all_authenticated"
  on public.bill_audits for all to authenticated using (true) with check (true);
