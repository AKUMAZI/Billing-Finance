"use client"

import { Download, FileText, TrendingUp, Users, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/mock-data"

const reportTypes = [
  {
    id: "revenue",
    title: "Revenue Report",
    description: "Monthly revenue breakdown by department and service type",
    icon: TrendingUp,
    lastGenerated: "March 23, 2024",
  },
  {
    id: "collections",
    title: "Collections Report",
    description: "Payment collections and outstanding balances summary",
    icon: CreditCard,
    lastGenerated: "March 23, 2024",
  },
  {
    id: "patient-billing",
    title: "Patient Billing Summary",
    description: "Individual patient billing history and payment status",
    icon: Users,
    lastGenerated: "March 22, 2024",
  },
  {
    id: "insurance",
    title: "Insurance Claims Report",
    description: "Insurance claim submissions and reimbursement status",
    icon: FileText,
    lastGenerated: "March 21, 2024",
  },
]

const summaryData = {
  totalRevenue: 2450000,
  totalCollections: 1980000,
  outstandingBalance: 470000,
  insuranceClaims: 520000,
}

export function ReportsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Revenue (MTD)</p>
            <p className="text-2xl font-bold mt-1 text-primary">
              {formatCurrency(summaryData.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Collections</p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {formatCurrency(summaryData.totalCollections)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Outstanding Balance</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">
              {formatCurrency(summaryData.outstandingBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Insurance Claims</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(summaryData.insuranceClaims)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
          <CardDescription>
            Select a report type to generate and download financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon
              return (
                <Card key={report.id} className="border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{report.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Last generated: {report.lastGenerated}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {[
              { month: "Oct", value: 1800000 },
              { month: "Nov", value: 2100000 },
              { month: "Dec", value: 2400000 },
              { month: "Jan", value: 1950000 },
              { month: "Feb", value: 2200000 },
              { month: "Mar", value: 2450000 },
            ].map((data) => {
              const maxValue = 2500000
              const height = (data.value / maxValue) * 100
              return (
                <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-muted-foreground mb-1">
                      {formatCurrency(data.value)}
                    </span>
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all hover:bg-primary/80"
                      style={{ height: `${height * 2}px` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{data.month}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
