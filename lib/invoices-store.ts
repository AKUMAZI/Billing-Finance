import { mockBills } from "@/lib/mock-data"

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

type InvoicesStore = Record<string, Invoice>

declare global {
  // eslint-disable-next-line no-var
  var __invoicesStore: InvoicesStore | undefined
}

function seedInvoices(): InvoicesStore {
  const now = new Date().toISOString()

  const seeded: InvoicesStore = {}
  for (const bill of mockBills) {
    const invoiceId = bill.bill_id.replace(/^BILL-/, "INV-")
    const services = bill.services_rendered ?? []
    const perService = services.length > 0 ? Number(bill.total_amount) / services.length : Number(bill.total_amount)

    const invoice: Invoice = {
      _id: invoiceId,
      invoice_id: invoiceId,
      patient_id: bill.patient_id,
      patient_name: bill.patient_name,
      health_record_id: invoiceId,
      diagnosis: "",
      items: services.map((serviceName) => ({
        serviceName,
        quantity: 1,
        unitPrice: perService,
        totalPrice: perService,
      })),
      prescription_names: [],
      is_released: false,
      total_amount: Number(bill.total_amount),
      invoice_date: bill.billing_date ? new Date(bill.billing_date).toISOString() : now,
      status: (bill.payment_status?.toLowerCase() === "paid" ? "paid" : "pending") as Invoice["status"],
      created_by: "seed",
      created_at: now,
      updated_at: now,
    }

    seeded[invoice.invoice_id] = invoice
  }
  return seeded
}

function getGlobalStore(): InvoicesStore {
  if (!globalThis.__invoicesStore) {
    globalThis.__invoicesStore = seedInvoices()
  }
  return globalThis.__invoicesStore
}

export function listInvoices(): Invoice[] {
  return Object.values(getGlobalStore())
}

export function getInvoice(invoiceId: string): Invoice | undefined {
  return getGlobalStore()[invoiceId]
}

export function upsertInvoice(invoice: Invoice): Invoice {
  const store = getGlobalStore()
  store[invoice.invoice_id] = invoice
  return invoice
}

export function deleteInvoice(invoiceId: string): boolean {
  const store = getGlobalStore()
  if (!store[invoiceId]) return false
  delete store[invoiceId]
  return true
}

