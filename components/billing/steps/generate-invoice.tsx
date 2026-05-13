"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Download, CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatCurrency, formatDate } from "@/lib/utils"
import type {
  ExternalInvoice,
  InvoicesApiResponse,
  Invoice,
  Patient,
  ChargeEntry,
  TaxComputation,
  LineItem,
} from "@/lib/types"

interface GenerateInvoiceProps {
  patient: Patient
  chargeEntry: ChargeEntry
  taxComputation: TaxComputation
  invoice: Invoice | null
  onUpdateInvoice: (invoice: Invoice) => void
  onBack: () => void
  onNext: () => void
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store", credentials: "include" }).then((res) => res.json())

function toYmd(iso: string): string {
  const s = iso.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toISOString().slice(0, 10)
}

function pmsItemsToLineItems(ext: ExternalInvoice): LineItem[] {
  const items = ext.items || []
  return items.map((it, idx) => ({
    id: it.medicineId || `pms-${ext._id}-${idx}`,
    category: "medication" as const,
    item_name: it.prescribedDosage
      ? `${it.medicineName} (${it.prescribedDosage})`
      : it.medicineName,
    quantity: it.prescribedQuantity,
    unit_price: it.unitPrice,
    total: it.totalPrice,
  }))
}

/**
 * PMS owns the invoice; we carry `_id` for PATCH when the receipt is paid.
 * Tax step discounts/insurance from this app are applied on top of PMS totals where sensible.
 */
function buildInvoiceFromPms(
  ext: ExternalInvoice,
  patient: Patient,
  taxComputation: TaxComputation,
): Invoice {
  const dateIssued = toYmd(ext.invoice_date)
  const due = new Date(dateIssued)
  due.setDate(due.getDate() + 14)

  const line_items = pmsItemsToLineItems(ext)
  const itemsSubtotal = line_items.reduce((s, i) => s + i.total, 0)
  const subtotal = itemsSubtotal > 0 ? itemsSubtotal : ext.total_amount

  const insurance = Math.min(taxComputation.insurance_coverage, ext.total_amount)
  // Amount to collect: PMS total minus insurance from this wizard (discount/tax rows reflect prior step for display only).
  const total_amount_due = Math.max(0, ext.total_amount - insurance)

  const status: Invoice["status"] =
    ext.status === "paid"
      ? "Paid"
      : ext.status === "pending"
        ? "Unpaid"
        : ext.status === "cancelled" || ext.status === "refunded"
          ? "Pending"
          : "Pending"

  return {
    _id: ext._id,
    invoice_id: ext.invoice_id,
    date_issued: dateIssued,
    due_date: due.toISOString().slice(0, 10),
    patient_id: ext.patient_id || patient.patient_id,
    patient_name: ext.patient_name || patient.full_name,
    patient_info: {
      address: patient.ward_room ? `Ward: ${patient.ward_room}` : "—",
      contact: patient.contact_number,
    },
    line_items,
    subtotal,
    discount_type: taxComputation.discount_type,
    discount_amount: taxComputation.discount_amount,
    tax_amount: taxComputation.tax_amount,
    insurance_coverage: insurance,
    total_amount_due,
    status,
  }
}

export function GenerateInvoice({
  patient,
  chargeEntry: _chargeEntry,
  taxComputation,
  invoice: _invoiceProp,
  onUpdateInvoice,
  onBack,
  onNext,
}: GenerateInvoiceProps) {
  const [selectedPmsId, setSelectedPmsId] = useState<string | null>(_invoiceProp?._id ?? null)

  const { data, error, isLoading } = useSWR<InvoicesApiResponse>(
    `/api/invoices?patient_id=${encodeURIComponent(patient.patient_id)}&limit=50&fresh=1`,
    fetcher,
    { revalidateOnFocus: false },
  )

  const invoices = data?.data?.invoices ?? []

  const payable = useMemo(
    () => invoices.filter((inv) => inv.status === "pending"),
    [invoices],
  )

  useEffect(() => {
    if (!payable.length || selectedPmsId) return
    setSelectedPmsId(payable[0]._id)
  }, [payable, selectedPmsId])

  const selected = useMemo(
    () => invoices.find((i) => i._id === selectedPmsId) ?? null,
    [invoices, selectedPmsId],
  )

  const invoiceData = useMemo(() => {
    if (!selected) return null
    return buildInvoiceFromPms(selected, patient, taxComputation)
  }, [selected, patient, taxComputation])

  useEffect(() => {
    if (!invoiceData) return
    onUpdateInvoice(invoiceData)
  }, [invoiceData, onUpdateInvoice])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading invoices from PMS…</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Could not load invoices from PMS. Try again or check your connection.</AlertDescription>
      </Alert>
    )
  }

  if (!invoices.length) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            No invoices found in PMS for this patient. Create the invoice in PMS first, then return here.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    )
  }

  if (!payable.length) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            This patient has no open (pending) invoices in PMS. Paid or closed invoices cannot be billed here.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    )
  }

  if (!invoiceData) return null

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "service":
        return "Services"
      case "medication":
        return "Medications"
      case "fee":
        return "Professional Fees"
      default:
        return category
    }
  }

  const groupedItems = invoiceData.line_items.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof invoiceData.line_items>,
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PMS invoice</CardTitle>
          <CardDescription>
            Invoices are created in PMS. Select the invoice to collect payment; the receipt step will mark this
            invoice <span className="font-medium">paid</span> in PMS using its id.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Open invoices (pending)</Label>
            <Select value={selectedPmsId ?? undefined} onValueChange={setSelectedPmsId}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                {payable.map((inv) => (
                  <SelectItem key={inv._id} value={inv._id}>
                    {inv.invoice_id} · {formatCurrency(inv.total_amount)} ·{" "}
                    {formatDate(toYmd(inv.invoice_date))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-muted-foreground font-mono">
                PMS id: {selected._id} (used when patching status to paid)
              </p>
            )}
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payable.map((inv) => (
                  <TableRow
                    key={inv._id}
                    className={inv._id === selectedPmsId ? "bg-muted/40" : ""}
                    onClick={() => setSelectedPmsId(inv._id)}
                  >
                    <TableCell className="font-mono text-sm">{inv.invoice_id}</TableCell>
                    <TableCell>{formatDate(toYmd(inv.invoice_date))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(inv.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{inv.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-primary p-8 text-primary-foreground">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl font-bold">H</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Smart Healthcare Medical Center</h2>
                    <p className="text-primary-foreground/80 text-sm">Excellence in Healthcare</p>
                  </div>
                </div>
                <p className="text-sm text-primary-foreground/70">
                  123 Medical Drive, Makati City, Philippines
                </p>
                <p className="text-sm text-primary-foreground/70">Tel: +63 2 8888 1234</p>
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold mb-2">INVOICE</h1>
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  {invoiceData.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Bill To:</h3>
                <p className="font-semibold text-lg">{invoiceData.patient_name}</p>
                <p className="text-sm text-muted-foreground">{invoiceData.patient_id}</p>
                <p className="text-sm text-muted-foreground">{invoiceData.patient_info.address}</p>
                <p className="text-sm text-muted-foreground">{invoiceData.patient_info.contact}</p>
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Invoice Number:</span>
                    <p className="font-mono font-semibold">{invoiceData.invoice_id}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date Issued:</span>
                    <p className="font-medium">{formatDate(invoiceData.date_issued)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Due Date:</span>
                    <p className="font-medium text-destructive">{formatDate(invoiceData.due_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden mb-8">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(groupedItems).map(([category, items]) => (
                    <Fragment key={category}>
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={4} className="font-semibold text-primary">
                          {getCategoryLabel(category)}
                        </TableCell>
                      </TableRow>
                      {items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-8">{item.item_name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoiceData.subtotal)}</span>
                </div>

                {invoiceData.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({invoiceData.discount_type})</span>
                    <span>-{formatCurrency(invoiceData.discount_amount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (12%)</span>
                  <span className="font-medium">{formatCurrency(invoiceData.tax_amount)}</span>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>Insurance Coverage</span>
                  <span>-{formatCurrency(invoiceData.insurance_coverage)}</span>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount Due</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(invoiceData.total_amount_due)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center">
                Invoice data from PMS. After payment, status will be updated to paid in PMS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
          <Button onClick={onNext} size="lg">
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  )
}
