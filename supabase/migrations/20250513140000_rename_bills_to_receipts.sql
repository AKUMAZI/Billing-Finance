-- Legacy upgrade: if an older migration created `public.bills`, rename it to `public.receipts`
-- and reattach the foreign key from bill_audits. Safe to run multiple times.

do $$
declare
  fkname text;
  has_receipts boolean;
  has_bills boolean;
begin
  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'receipts'
  ) into has_receipts;

  select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'bills'
  ) into has_bills;

  if has_receipts or not has_bills then
    return;
  end if;

  select c.conname into fkname
  from pg_constraint c
  join pg_class rel on rel.oid = c.conrelid
  join pg_namespace n on n.oid = rel.relnamespace
  where n.nspname = 'public'
    and rel.relname = 'bill_audits'
    and c.contype = 'f'
    and pg_get_constraintdef(c.oid) like '%bills%'
  limit 1;

  if fkname is not null then
    execute format('alter table public.bill_audits drop constraint %I', fkname);
  end if;

  alter table public.bills rename to receipts;

  alter table public.bill_audits
    add constraint bill_audits_bill_id_fkey
    foreign key (bill_id) references public.receipts (bill_id) on delete cascade;

  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'i' and c.relname = 'idx_bills_patient_visit') then
    alter index public.idx_bills_patient_visit rename to idx_receipts_patient_visit;
  end if;

  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'i' and c.relname = 'idx_bills_created_at') then
    alter index public.idx_bills_created_at rename to idx_receipts_created_at;
  end if;
end$$;
