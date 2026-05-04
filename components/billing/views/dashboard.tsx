"use client"

import { FileText, CreditCard, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockBills, formatCurrency, formatDate } from "@/lib/mock-data"

const stats = [
  {
    title: "Total Revenue (MTD)",
    value: "₱2,450,000",
    change: "+12.5%",
    icon: TrendingUp,
    color: "text-green-600",
  },
  {
    title: "Pending Invoices",
    value: "23",
    subtext: "₱485,000 outstanding",
    icon: FileText,
    color: "text-amber-600",
  },
  {
    title: "Payments Today",
    value: "₱125,000",
    change: "+8.2%",
    icon: CreditCard,
    color: "text-primary",
  },
  {
    title: "Overdue Accounts",
    value: "5",
    subtext: "₱92,000 overdue",
    icon: AlertCircle,
    color: "text-destructive",
  },
]

export function DashboardView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    {stat.change && (
                      <p className={`text-sm ${stat.color} mt-1`}>{stat.change} from last month</p>
                    )}
                    {stat.subtext && (
                      <p className="text-sm text-muted-foreground mt-1">{stat.subtext}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBills.map((bill) => (
                <div
                  key={bill.bill_id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{bill.patient_name}</p>
                    <p className="text-sm text-muted-foreground">{bill.bill_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(bill.total_amount)}</p>
                    <Badge
                      variant={
                        bill.payment_status === "Paid"
                          ? "default"
                          : bill.payment_status === "Pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className={
                        bill.payment_status === "Paid"
                          ? "bg-green-500"
                          : bill.payment_status === "Pending"
                            ? "bg-amber-500"
                            : ""
                      }
                    >
                      {bill.payment_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Due Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBills
                .filter((b) => b.payment_status !== "Paid")
                .map((bill) => (
                  <div
                    key={bill.bill_id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{bill.patient_name}</p>
                      <p className="text-sm text-muted-foreground">Due: {formatDate(bill.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-destructive">
                        {formatCurrency(bill.patient_balance)}
                      </p>
                      <p className="text-sm text-muted-foreground">Balance</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
