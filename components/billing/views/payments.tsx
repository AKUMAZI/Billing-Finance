"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { formatCurrency } from "@/lib/mock-data"

interface PaymentRecord {
  receipt_id: string
  invoice_id: string
  patient_name: string
  payment_date: string
  amount_paid: number
  payment_method: string
  processed_by: string
}

const mockPayments: PaymentRecord[] = [
  {
    receipt_id: "REC-2024-00456",
    invoice_id: "INV-2024-00389",
    patient_name: "Juan dela Cruz",
    payment_date: "2024-03-22T14:30:00",
    amount_paid: 2500.0,
    payment_method: "Cash",
    processed_by: "Admin User",
  },
  {
    receipt_id: "REC-2024-00457",
    invoice_id: "INV-2024-00392",
    patient_name: "Ana Reyes",
    payment_date: "2024-03-19T10:15:00",
    amount_paid: 1000.0,
    payment_method: "Credit Card",
    processed_by: "Billing Staff",
  },
  {
    receipt_id: "REC-2024-00458",
    invoice_id: "INV-2024-00385",
    patient_name: "Pedro Pascual",
    payment_date: "2024-03-18T16:45:00",
    amount_paid: 15000.0,
    payment_method: "HMO",
    processed_by: "Admin User",
  },
  {
    receipt_id: "REC-2024-00459",
    invoice_id: "INV-2024-00380",
    patient_name: "Rosa Garcia",
    payment_date: "2024-03-17T09:00:00",
    amount_paid: 8500.0,
    payment_method: "PhilHealth",
    processed_by: "Billing Staff",
  },
  {
    receipt_id: "REC-2024-00460",
    invoice_id: "INV-2024-00375",
    patient_name: "Miguel Bautista",
    payment_date: "2024-03-15T11:30:00",
    amount_paid: 22000.0,
    payment_method: "Split Payment",
    processed_by: "Admin User",
  },
]

export function PaymentsView() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPayments = mockPayments.filter(
    (payment) =>
      payment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receipt_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      Cash: "bg-green-100 text-green-800",
      "Credit Card": "bg-blue-100 text-blue-800",
      PhilHealth: "bg-amber-100 text-amber-800",
      HMO: "bg-purple-100 text-purple-800",
      "Split Payment": "bg-pink-100 text-pink-800",
    }
    return (
      <Badge variant="secondary" className={colors[method] || ""}>
        {method}
      </Badge>
    )
  }

  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount_paid, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Payments (Today)</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalPayments)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold mt-1">{filteredPayments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Average Payment</p>
            <p className="text-2xl font-bold mt-1">
              {formatCurrency(totalPayments / filteredPayments.length || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
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
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Processed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.receipt_id}>
                    <TableCell className="font-mono text-sm">{payment.receipt_id}</TableCell>
                    <TableCell className="font-mono text-sm">{payment.invoice_id}</TableCell>
                    <TableCell className="font-medium">{payment.patient_name}</TableCell>
                    <TableCell>{formatDateTime(payment.payment_date)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(payment.amount_paid)}
                    </TableCell>
                    <TableCell>{getMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell>{payment.processed_by}</TableCell>
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
