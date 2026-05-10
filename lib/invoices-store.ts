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

function getGlobalStore(): InvoicesStore {
  if (!globalThis.__invoicesStore) {
    globalThis.__invoicesStore = {}
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

