import { getSupabase } from "@/lib/db/supabase"

export type InvoiceItem = {
  medicineId?: string
  medicineName?: string
  prescribedDosage?: string
  prescribedQuantity?: number
  unitPrice?: number
  totalPrice?: number
  serviceName?: string
  quantity?: number
}

export type Invoice = {
  _id: string
  invoice_id: string
  patient_id: string
  patient_name: string
  health_record_id: string
  diagnosis: string
  items: InvoiceItem[]
  prescription_names: string[]
  is_released: boolean
  total_amount: number
  invoice_date: string
  status: "pending" | "paid" | "cancelled" | "refunded"
  created_by: string
  created_at: string
  updated_at: string
  updated_by?: string
}

function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value !== "string") return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : fallback
  } catch {
    return fallback
  }
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    ...(row as Invoice),
    items: parseJsonArray<InvoiceItem>(row.items, []),
    prescription_names: parseJsonArray<string>(row.prescription_names, []),
    is_released: Boolean(row.is_released),
  }
}

function invoiceToRow(invoice: Invoice) {
  return {
    invoice_id: invoice.invoice_id,
    _id: invoice._id,
    patient_id: invoice.patient_id,
    patient_name: invoice.patient_name,
    health_record_id: invoice.health_record_id,
    diagnosis: invoice.diagnosis ?? "",
    items: invoice.items ?? [],
    prescription_names: invoice.prescription_names ?? [],
    is_released: invoice.is_released,
    total_amount: invoice.total_amount,
    invoice_date: invoice.invoice_date,
    status: invoice.status,
    created_by: invoice.created_by,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
    updated_by: invoice.updated_by ?? null,
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false })
  if (error) throw new Error(`listInvoices: ${error.message}`)
  return (data ?? []).map((row) => rowToInvoice(row as Record<string, unknown>))
}

export async function getInvoice(invoiceId: string): Promise<Invoice | undefined> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("invoices").select("*").eq("invoice_id", invoiceId).maybeSingle()
  if (error) throw new Error(`getInvoice: ${error.message}`)
  if (!data) return undefined
  return rowToInvoice(data as Record<string, unknown>)
}

export async function upsertInvoice(invoice: Invoice): Promise<Invoice> {
  const supabase = getSupabase()
  const row = invoiceToRow(invoice)
  const { data, error } = await supabase.from("invoices").upsert(row, { onConflict: "invoice_id" }).select("*").single()
  if (error) throw new Error(`upsertInvoice: ${error.message}`)
  if (!data) throw new Error(`Failed to save invoice ${invoice.invoice_id}`)
  return rowToInvoice(data as Record<string, unknown>)
}

export async function deleteInvoice(invoiceId: string): Promise<boolean> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from("invoices").delete().eq("invoice_id", invoiceId).select("invoice_id")
  if (error) throw new Error(`deleteInvoice: ${error.message}`)
  return Array.isArray(data) && data.length > 0
}
