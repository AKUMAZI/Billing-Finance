"use client"

import { useState } from "react"
import { Search, CheckCircle2, Clock, XCircle } from "lucide-react"
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

interface InsuranceClaim {
  claim_id: string
  patient_name: string
  patient_id: string
  insurance_provider: string
  claim_amount: number
  date_filed: string
  status: "Approved" | "Pending" | "Rejected"
  remarks?: string
}

const mockClaims: InsuranceClaim[] = [
  {
    claim_id: "CLM-2024-00101",
    patient_name: "Juan dela Cruz",
    patient_id: "PAT-2024-00142",
    insurance_provider: "PhilHealth",
    claim_amount: 2000.0,
    date_filed: "2024-03-22",
    status: "Approved",
    remarks: "Claim processed successfully",
  },
  {
    claim_id: "CLM-2024-00102",
    patient_name: "Maria Santos",
    patient_id: "PAT-2024-00143",
    insurance_provider: "Maxicare",
    claim_amount: 50000.0,
    date_filed: "2024-03-23",
    status: "Pending",
    remarks: "Awaiting additional documents",
  },
  {
    claim_id: "CLM-2024-00103",
    patient_name: "Jose Rizal Jr.",
    patient_id: "PAT-2024-00144",
    insurance_provider: "PhilHealth",
    claim_amount: 45000.0,
    date_filed: "2024-03-21",
    status: "Approved",
  },
  {
    claim_id: "CLM-2024-00104",
    patient_name: "Ana Reyes",
    patient_id: "PAT-2024-00145",
    insurance_provider: "Intellicare",
    claim_amount: 2500.0,
    date_filed: "2024-03-19",
    status: "Approved",
  },
  {
    claim_id: "CLM-2024-00105",
    patient_name: "Pedro Pascual",
    patient_id: "PAT-2024-00146",
    insurance_provider: "Medicard",
    claim_amount: 15000.0,
    date_filed: "2024-03-18",
    status: "Rejected",
    remarks: "Coverage limit exceeded",
  },
  {
    claim_id: "CLM-2024-00106",
    patient_name: "Teresa Villanueva",
    patient_id: "PAT-2024-00149",
    insurance_provider: "PhilHealth",
    claim_amount: 8000.0,
    date_filed: "2024-03-20",
    status: "Pending",
  },
]

export function InsuranceView() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClaims = mockClaims.filter(
    (claim) =>
      claim.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claim_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insurance_provider.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const approvedClaims = mockClaims.filter((c) => c.status === "Approved")
  const pendingClaims = mockClaims.filter((c) => c.status === "Pending")
  const rejectedClaims = mockClaims.filter((c) => c.status === "Rejected")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "Pending":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "Rejected":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Claims</p>
            <p className="text-2xl font-bold mt-1">{mockClaims.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
            <p className="text-2xl font-bold mt-1 text-green-600">{approvedClaims.length}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(approvedClaims.reduce((sum, c) => sum + c.claim_amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <p className="text-2xl font-bold mt-1 text-amber-600">{pendingClaims.length}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(pendingClaims.reduce((sum, c) => sum + c.claim_amount, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
            <p className="text-2xl font-bold mt-1 text-destructive">{rejectedClaims.length}</p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(rejectedClaims.reduce((sum, c) => sum + c.claim_amount, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Insurance Claims</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>File New Claim</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Insurance Provider</TableHead>
                  <TableHead className="text-right">Claim Amount</TableHead>
                  <TableHead>Date Filed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.claim_id}>
                    <TableCell className="font-mono text-sm">{claim.claim_id}</TableCell>
                    <TableCell className="font-medium">{claim.patient_name}</TableCell>
                    <TableCell>{claim.insurance_provider}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(claim.claim_amount)}
                    </TableCell>
                    <TableCell>{formatDate(claim.date_filed)}</TableCell>
                    <TableCell>{getStatusBadge(claim.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {claim.remarks || "-"}
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
