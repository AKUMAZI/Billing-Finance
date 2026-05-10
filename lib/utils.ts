import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateInvoiceId(): string {
  const year = new Date().getFullYear()
  const num = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0")
  return `INV-${year}-${num}`
}

export function generateReceiptId(): string {
  const year = new Date().getFullYear()
  const num = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0")
  return `REC-${year}-${num}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
