"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { Eye, RefreshCw, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import type { BillRecord } from "@/lib/billing/types"

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((res) => res.json())

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount)
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ReceiptsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)

  const { data: billsData, error, isLoading, mutate } = useSWR<{ data: BillRecord[] }>(
    "/api/bills",
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 30_000 }
  )

  const { data: selectedBillData, isLoading: selectedBillLoading } = useSWR<{ data: BillRecord }>(
    selectedBillId ? `/api/bills/${encodeURIComponent(selectedBillId)}` : null,
    fetcher
  )

  const bills = billsData?.data || []

  useEffect(() => {
    if (typeof window === "undefined") return
    let channel: BroadcastChannel | null = null

    try {
      channel = new BroadcastChannel("billing-dashboard")
    } catch {
      return
    }

    const onMessage = async (event: MessageEvent) => {
      const data = event.data as { type?: string; bill_id?: string } | undefined
      if (!data || data.type !== "bill_created") return

      const ts = Date.now()
      try {
        await mutate(fetcher(`/api/bills?_=${ts}`), { revalidate: false })
      } catch {
        // ignore; SWR will retry/poll anyway
      }
    }

    channel.addEventListener("message", onMessage)
    return () => {
      channel?.removeEventListener("message", onMessage)
      channel?.close()
    }
  }, [mutate])

  const filteredBills = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return bills
    return bills.filter((bill) => {
      return (
        bill.bill_id.toLowerCase().includes(q) ||
        bill.patient_name.toLowerCase().includes(q) ||
        bill.patient_id.toLowerCase().includes(q)
      )
    })
  }, [bills, searchTerm])

  const totalReceipts = bills.filter((b) => !b.is_voided).length
  const voidedReceipts = bills.filter((b) => b.is_voided).length
  const totalCollected = bills
    .filter((b) => !b.is_voided && b.payment_status === "Paid")
    .reduce((sum, b) => sum + b.patient_balance, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Receipts</p>
            <p className="text-2xl font-bold mt-1">{totalReceipts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Voided</p>
            <p className="text-2xl font-bold mt-1 text-destructive">{voidedReceipts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Collected (Paid)</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Receipts</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bill ID or patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => mutate()} aria-label="Refresh receipts">
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && bills.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              Failed to load receipts. Please try again.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Receipt ID</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No receipts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills
                      .slice()
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((bill) => (
                        <TableRow key={bill.bill_id}>
                          <TableCell className="font-mono text-sm">{bill.bill_id}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium">{bill.patient_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{bill.patient_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>{bill.visit_date}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(bill.total_amount)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(bill.patient_balance)}</TableCell>
                          <TableCell>
                            {bill.is_voided ? (
                              <Badge variant="outline" className="text-destructive border-destructive">
                                voided
                              </Badge>
                            ) : (
                              <Badge variant="outline">{bill.payment_status}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedBillId(bill.bill_id)}
                              aria-label="View receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedBillId !== null} onOpenChange={(open) => (!open ? setSelectedBillId(null) : undefined)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              {selectedBillId ? `Bill ID: ${selectedBillId}` : "Bill details"}
            </DialogDescription>
          </DialogHeader>

          {!selectedBillId ? null : selectedBillLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedBillData?.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedBillData.data.patient_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedBillData.data.patient_id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Visit Date</p>
                  <p className="font-medium">{selectedBillData.data.visit_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Billing Date</p>
                  <p className="font-medium">{selectedBillData.data.billing_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(selectedBillData.data.created_at)}</p>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(selectedBillData.data.total_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Insurance Coverage</span>
                  <span className="font-medium">{formatCurrency(selectedBillData.data.insurance_coverage)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Patient Balance</span>
                  <span className="font-medium">{formatCurrency(selectedBillData.data.patient_balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment</span>
                  <span className="font-medium">
                    {selectedBillData.data.is_voided ? "voided" : selectedBillData.data.payment_status} ·{" "}
                    {selectedBillData.data.payment_method}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Services Rendered</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBillData.data.services_rendered.map((service) => (
                    <Badge key={service} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load bill details.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

