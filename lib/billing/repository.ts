import type { AuditEntry, BillRecord } from "./types";
import { getSupabase } from "@/lib/db/supabase";

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function parseJsonObject(value: unknown, fallback: Record<string, unknown>): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return fallback;
  } catch {
    return fallback;
  }
}

function rowToBill(row: Record<string, unknown>): BillRecord {
  return {
    ...(row as unknown as BillRecord),
    services_rendered: parseJsonArray<string>(row.services_rendered, []),
    is_insurance_claimed: Boolean(row.is_insurance_claimed),
    is_voided: Boolean(row.is_voided),
    voided_at: (row.voided_at as string | null) ?? null,
  };
}

function billToRow(bill: BillRecord) {
  return {
    bill_id: bill.bill_id,
    patient_id: bill.patient_id,
    patient_name: bill.patient_name,
    visit_date: bill.visit_date,
    services_rendered: bill.services_rendered ?? [],
    total_amount: bill.total_amount,
    insurance_provider: bill.insurance_provider,
    insurance_coverage: bill.insurance_coverage,
    patient_balance: bill.patient_balance,
    payment_method: bill.payment_method,
    payment_status: bill.payment_status,
    billing_date: bill.billing_date,
    due_date: bill.due_date,
    is_insurance_claimed: bill.is_insurance_claimed,
    attending_doctor_id: bill.attending_doctor_id,
    is_voided: bill.is_voided,
    voided_at: bill.voided_at ?? null,
    created_at: bill.created_at,
    updated_at: bill.updated_at,
  };
}

export async function getAllBills(): Promise<BillRecord[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("receipts").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`getAllBills: ${error.message}`);
  return (data ?? []).map((row) => rowToBill(row as Record<string, unknown>));
}

export async function getBillById(billId: string): Promise<BillRecord | undefined> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("receipts").select("*").eq("bill_id", billId).maybeSingle();
  if (error) throw new Error(`getBillById: ${error.message}`);
  if (!data) return undefined;
  return rowToBill(data as Record<string, unknown>);
}

export async function saveBill(bill: BillRecord): Promise<BillRecord> {
  const supabase = getSupabase();
  const row = billToRow(bill);
  const { data, error } = await supabase.from("receipts").upsert(row, { onConflict: "bill_id" }).select("*");
  if (error) throw new Error(`saveBill: ${error.message}`);
  const saved = data?.[0];
  if (!saved) {
    throw new Error(
      "saveBill: upsert returned no rows. Common causes: table `receipts` missing in Supabase, or RLS allows INSERT but not SELECT on that row. Use SUPABASE_SERVICE_ROLE_KEY on the server or add matching RLS policies.",
    );
  }
  return rowToBill(saved as Record<string, unknown>);
}

export async function findBillByPatientAndVisit(
  patientId: string,
  visitDate: string,
): Promise<BillRecord | undefined> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("patient_id", patientId)
    .eq("visit_date", visitDate)
    .eq("is_voided", false)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`findBillByPatientAndVisit: ${error.message}`);
  if (!data) return undefined;
  return rowToBill(data as Record<string, unknown>);
}

export async function appendAuditLog(entry: AuditEntry): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("bill_audits").insert({
    audit_id: entry.audit_id,
    bill_id: entry.bill_id,
    action: entry.action,
    actor_id: entry.actor_id,
    actor_role: entry.actor_role,
    timestamp: entry.timestamp,
    changes: entry.changes ?? {},
  });
  if (error) throw new Error(`appendAuditLog: ${error.message}`);
}

export async function getAuditLogsByBillId(billId: string): Promise<AuditEntry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bill_audits")
    .select("*")
    .eq("bill_id", billId)
    .order("timestamp", { ascending: true });
  if (error) throw new Error(`getAuditLogsByBillId: ${error.message}`);
  return (data ?? []).map((row) => ({
    ...(row as AuditEntry),
    changes: parseJsonObject((row as Record<string, unknown>).changes, {}),
  }));
}
