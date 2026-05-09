"use client"

import { useState } from "react"
import { FileText, CreditCard, TrendingUp, Users, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import useSWR from "swr"
import type { InvoicesApiResponse, PatientsApiResponse } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function DashboardView() {
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const { data: invoicesData, isLoading: invoicesLoading, mutate: mutateInvoices } = useSWR<InvoicesApiResponse>(
    "/api/invoices?limit=50",
    fetcher,
    { onSuccess: () => setLastUpdated(new Date()) }
  )

  const { data: patientsData, isLoading: patientsLoading, mutate: mutatePatients } = useSWR<PatientsApiResponse>(
    "/api/patients?limit=50",
    fetcher
  )

  const { data: billsData, isLoading: billsLoading, mutate: mutateBills } = useSWR(
    "/api/bills",
    fetcher
  )

  const invoices = invoicesData?.data?.invoices || []
  const patients = patientsData?.data?.patients || []
  const bills = billsData?.data || []

  // Calculate stats from real data
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  const pendingInvoices = invoices.filter((inv) => inv.status === "pending")
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)

  const paidToday = invoices.filter((inv) => {
    const invoiceDate = new Date(inv.invoice_date).toDateString()
    const today = new Date().toDateString()
    return inv.status === "paid" && invoiceDate === today
  })
  const paidTodayAmount = paidToday.reduce((sum, inv) => sum + inv.total_amount, 0)

  function formatTimeAgo(date: Date | null): string {
    if (!date) return "Never"
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSeconds < 60) return "Just now"
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  const totalPatients = patientsData?.pagination?.total || patients.length
  const activePatients = patients.filter((p) => p.status === "active").length

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      subtext: `${invoices.filter((i) => i.status === "paid").length} paid invoices`,
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "Pending Invoices",
      value: pendingInvoices.length.toString(),
      subtext: `${formatCurrency(pendingAmount)} outstanding`,
      icon: FileText,
      color: "text-amber-600",
    },
    {
      title: "Payments Today",
      value: formatCurrency(paidTodayAmount),
      subtext: `${paidToday.length} transactions • Updated ${formatTimeAgo(lastUpdated)}`,
      icon: CreditCard,
      color: "text-primary",
      lastUpdated,
    },
    {
      title: "Total Patients",
      value: totalPatients.toString(),
      subtext: `${activePatients} active patients`,
      icon: Users,
      color: "text-blue-600",
    },
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([mutateInvoices(), mutatePatients(), mutateBills()])
    } finally {
      setIsRefreshing(false)
    }
  }

  const isLoading = invoicesLoading || patientsLoading || billsLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time billing statistics from patient management system</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      {stat.subtext && (
                        <p className="text-sm text-muted-foreground mt-1">{stat.subtext}</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Generated Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {billsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bills.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No bills generated yet</p>
          ) : (
            <div className="space-y-2">
              {bills.slice(0, 5).map((bill: any) => (
                <button
                  key={bill.bill_id}
                  onClick={() => setSelectedBill(bill)}
                  className="w-full text-left p-4 bg-muted/50 hover:bg-muted rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium group-hover:text-primary transition-colors">{bill.bill_id}</p>
                      <p className="text-sm text-muted-foreground">{bill.patient_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(bill.total_amount)}</p>
                      <Badge
                        variant="outline"
                        className={
                          bill.payment_status === "Paid"
                            ? "bg-green-500/10 text-green-600 border-green-600"
                            : bill.payment_status === "Pending"
                              ? "bg-amber-500/10 text-amber-600 border-amber-600"
                              : "bg-red-500/10 text-red-600 border-red-600"
                        }
                      >
                        {bill.payment_status}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No invoices found</p>
            ) : (
              <div className="space-y-4">
                {invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.invoice_id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invoice.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.invoice_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total_amount)}</p>
                      <Badge
                        variant="outline"
                        className={
                          invoice.status === "paid"
                            ? "bg-green-500/10 text-green-600 border-green-600"
                            : invoice.status === "pending"
                              ? "bg-amber-500/10 text-amber-600 border-amber-600"
                              : "bg-red-500/10 text-red-600 border-red-600"
                        }
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No patients found</p>
            ) : (
              <div className="space-y-4">
                {patients.slice(0, 5).map((patient) => (
                  <div
                    key={patient.patient_id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-medium text-sm">
                          {patient.first_name[0]}{patient.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                        <p className="text-sm text-muted-foreground">{patient.patient_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{patient.insurance?.provider || "Self-Pay"}</p>
                      <Badge
                        variant="outline"
                        className={
                          patient.status === "active"
                            ? "text-green-600 border-green-600"
                            : "text-muted-foreground"
                        }
                      >
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Details Modal */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details - {selectedBill?.bill_id}</DialogTitle>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient Name</p>
                  <p className="font-semibold">{selectedBill.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-semibold">{selectedBill.patient_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Date</p>
                  <p className="font-semibold">{formatDate(selectedBill.billing_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-semibold">{formatDate(selectedBill.due_date)}</p>
                </div>
              </div>

              {/* Services Rendered */}
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">Services Rendered</p>
                <div className="space-y-2">
                  {selectedBill.services_rendered && selectedBill.services_rendered.length > 0 ? (
                    selectedBill.services_rendered.map((service: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No services listed</p>
                  )}
                </div>
              </div>

              {/* Billing Details */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(selectedBill.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Insurance Provider</span>
                  <span className="font-semibold">{selectedBill.insurance_provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Insurance Coverage</span>
                  <span className="font-semibold">{selectedBill.insurance_coverage}%</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold">Patient Balance</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedBill.patient_balance)}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-semibold">{selectedBill.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge
                    className={
                      selectedBill.payment_status === "Paid"
                        ? "bg-green-500/10 text-green-600 border border-green-600"
                        : selectedBill.payment_status === "Pending"
                          ? "bg-amber-500/10 text-amber-600 border border-amber-600"
                          : "bg-red-500/10 text-red-600 border border-red-600"
                    }
                  >
                    {selectedBill.payment_status}
                  </Badge>
                </div>
              </div>

              {/* Insurance Claim Status */}
              <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm">Insurance Claim Status</span>
                <Badge variant={selectedBill.is_insurance_claimed ? "default" : "outline"}>
                  {selectedBill.is_insurance_claimed ? "Claimed" : "Not Claimed"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
