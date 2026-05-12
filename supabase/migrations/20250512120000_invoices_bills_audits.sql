-- Run in Supabase SQL editor or via Supabase CLI.
-- For server-side Next.js API routes, set SUPABASE_SERVICE_ROLE_KEY (recommended) or configure RLS for the anon/publishable key.

create table if not exists public.invoices (
  invoice_id text primary key,
  _id text not null,
  patient_id text not null,
  patient_name text not null,
  health_record_id text not null,
  diagnosis text not null default '',
  items jsonb not null default '[]'::jsonb,
  prescription_names jsonb not null default '[]'::jsonb,
  is_released boolean not null default false,
  total_amount double precision not null,
  invoice_date text not null,
  status text not null,
  created_by text not null,
  created_at text not null,
  updated_at text not null,
  updated_by text
);

create index if not exists idx_invoices_patient_id on public.invoices (patient_id);
create index if not exists idx_invoices_created_at on public.invoices (created_at desc);

create table if not exists public.receipts (
  bill_id text primary key,
  patient_id text not null,
  patient_name text not null,
  visit_date text not null,
  services_rendered jsonb not null default '[]'::jsonb,
  total_amount double precision not null,
  insurance_provider text not null,
  insurance_coverage double precision not null,
  patient_balance double precision not null,
  payment_method text not null,
  payment_status text not null,
  billing_date text not null,
  due_date text not null,
  is_insurance_claimed boolean not null default false,
  attending_doctor_id text not null,
  is_voided boolean not null default false,
  voided_at text,
  created_at text not null,
  updated_at text not null
);

create index if not exists idx_receipts_patient_visit on public.receipts (patient_id, visit_date);
create index if not exists idx_receipts_created_at on public.receipts (created_at desc);

create table if not exists public.bill_audits (
  audit_id text primary key,
  bill_id text not null references public.receipts (bill_id) on delete cascade,
  action text not null,
  actor_id text not null,
  actor_role text not null,
  timestamp text not null,
  changes jsonb not null default '{}'::jsonb
);

create index if not exists idx_bill_audits_bill_id on public.bill_audits (bill_id);
create index if not exists idx_bill_audits_timestamp on public.bill_audits (timestamp);
