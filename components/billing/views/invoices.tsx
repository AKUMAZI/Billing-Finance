"use client"

import { useState } from "react"
import { Search, Eye, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/mock-data"
import type { Bill } from "@/lib/types"

const mockInvoices: (Bill & { invoice_id: string })[] = [
  {
    invoice_id: "INV-2024-00389",
    bill_id: "BILL-2024-00389",
    patient_id: "PAT-2024-00142",
    patient_name: "Juan dela Cruz",
    visit_date: "2024-03-22",
    services_rendered: ["Consultation", "Blood Test", "X-Ray"],
    total_amount: 4500.0,
    insurance_provider: "PhilHealth",
    insurance_coverage: 2000.0,
    patient_balance: 2500.0,
    payment_method: "Cash",
    payment_status: "Paid",
    billing_date: "2024-03-22",
    due_date: "2024-04-05",
    is_insurance_claimed: true,
    attending_doctor_id: "DOC-0045",
  },
  {
    invoice_id: "INV-2024-00390",
    bill_id: "BILL-2024-00390",
    patient_id: "PAT-2024-00143",
    patient_name: "Maria Santos",
    visit_date: "2024-03-20",
    services_rendered: ["Surgery", "Room & Board", "Medications"],
    total_amount: 85000.0,
    insurance_provider: "Maxicare",
    insurance_coverage: 50000.0,
    patient_balance: 35000.0,
    payment_method: "HMO",
    payment_status: "Pending",
    billing_date: "2024-03-23",
    due_date: "2024-04-06",
    is_insurance_claimed: false,
    attending_doctor_id: "DOC-0046",
  },
  {
    invoice_id: "INV-2024-00391",
    bill_id: "BILL-2024-00391",
    patient_id: "PAT-2024-00144",
    patient_name: "Jose Rizal Jr.",
    visit_date: "2024-03-18",
    services_rendered: ["ICU Care", "Dialysis", "Medications"],
    total_amount: 125000.0,
    insurance_provider: "PhilHealth",
    insurance_coverage: 45000.0,
    patient_balance: 80000.0,
    payment_method: "Split Payment",
    payment_status: "Unpaid",
    billing_date: "2024-03-21",
    due_date: "2024-04-04",
    is_insurance_claimed: true,
    attending_doctor_id: "DOC-0047",
  },
  {
    invoice_id: "INV-2024-00392",
    bill_id: "BILL-2024-00392",
    patient_id: "PAT-2024-00145",
    patient_name: "Ana Reyes",
    visit_date: "2024-03-19",
    services_rendered: ["Consultation", "Ultrasound"],
    total_amount: 3500.0,
    insurance_provider: "Intellicare",
    insurance_coverage: 2500.0,
    patient_balance: 1000.0,
    payment_method: "Credit Card",
    payment_status: "Paid",
    billing_date: "2024-03-19",
    due_date: "2024-04-02",
    is_insurance_claimed: true,
    attending_doctor_id: "DOC-0048",
  },
]

export function InvoicesView() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredInvoices = mockInvoices.filter(
    (invoice) =>
      invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoice_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>
      case "Pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
      case "Unpaid":
        return <Badge variant="destructive">Unpaid</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Invoices</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.invoice_id}>
                    <TableCell className="font-mono text-sm">{invoice.invoice_id}</TableCell>
                    <TableCell className="font-medium">{invoice.patient_name}</TableCell>
                    <TableCell>{formatDate(invoice.billing_date)}</TableCell>
                    <TableCell>{formatDate(invoice.due_date)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
