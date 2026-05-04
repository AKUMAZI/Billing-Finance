"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { mockPatients, formatDate } from "@/lib/mock-data"
import type { Patient } from "@/lib/types"

interface SelectPatientProps {
  selectedPatient: Patient | null
  onSelectPatient: (patient: Patient) => void
  onNext: () => void
}

export function SelectPatient({ selectedPatient, onSelectPatient, onNext }: SelectPatientProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPatients = mockPatients.filter(
    (patient) =>
      patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.ward_room.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {selectedPatient && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">Selected Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    {selectedPatient.full_name.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{selectedPatient.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPatient.patient_id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Insurance Provider</p>
                <p className="font-medium text-foreground">{selectedPatient.insurance_provider}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Patient</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Ward / Room</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.patient_id}
                    className={selectedPatient?.patient_id === patient.patient_id ? "bg-primary/5" : ""}
                  >
                    <TableCell className="font-mono text-sm">{patient.patient_id}</TableCell>
                    <TableCell className="font-medium">{patient.full_name}</TableCell>
                    <TableCell>{formatDate(patient.date_of_birth)}</TableCell>
                    <TableCell>{patient.ward_room}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={selectedPatient?.patient_id === patient.patient_id ? "default" : "outline"}
                        onClick={() => onSelectPatient(patient)}
                      >
                        {selectedPatient?.patient_id === patient.patient_id ? "Selected" : "Select"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!selectedPatient} size="lg">
          Continue to Charge Entry
        </Button>
      </div>
    </div>
  )
}
