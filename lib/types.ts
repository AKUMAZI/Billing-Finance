// Billing & Insurance Data Structure
export interface Bill {
  bill_id: string
  patient_id: string
  patient_name: string
  visit_date: string
  services_rendered: string[]
  total_amount: number
  insurance_provider: string
  insurance_coverage: number
  patient_balance: number
  payment_method: string
  payment_status: "Paid" | "Unpaid" | "Pending"
  billing_date: string
  due_date: string
  is_insurance_claimed: boolean
  attending_doctor_id: string
}

export interface Patient {
  patient_id: string
  full_name: string
  date_of_birth: string
  ward_room: string
  insurance_provider: string
}

export interface LineItem {
  id: string
  category: "service" | "medication" | "fee"
  item_name: string
  quantity: number
  unit_price: number
  total: number
}

export interface ChargeEntry {
  patient_id: string
  patient_name: string
  attending_physician: string
  attending_doctor_id: string
  ward_room: string
  date_of_admission: string
  date_of_discharge: string
  line_items: LineItem[]
  subtotal: number
}

export interface TaxComputation {
  subtotal: number
  discount_type: "None" | "Senior" | "PWD" | "Promo"
  discount_amount: number
  tax_rate: number
  tax_amount: number
  insurance_coverage: number
  total_amount_due: number
}

export interface Invoice {
  invoice_id: string
  date_issued: string
  due_date: string
  patient_id: string
  patient_name: string
  patient_info: {
    address: string
    contact: string
  }
  line_items: LineItem[]
  subtotal: number
  discount_type: string
  discount_amount: number
  tax_amount: number
  insurance_coverage: number
  total_amount_due: number
  status: "Paid" | "Unpaid" | "Pending"
}

export interface Payment {
  amount_due: number
  payment_method: "Cash" | "Credit Card" | "PhilHealth" | "HMO" | "Split Payment"
  amount_tendered: number
  change: number
}

export interface Receipt {
  receipt_id: string
  patient_name: string
  invoice_id: string
  date_time: string
  amount_paid: number
  payment_method: string
  processed_by: string
  balance_remaining: number
  status: "Paid"
}
