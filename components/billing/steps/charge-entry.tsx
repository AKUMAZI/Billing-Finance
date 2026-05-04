"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  mockPhysicians,
  mockServicesFromAdmin,
  mockMedicationsFromInventory,
  mockDoctorFeesFromStaffMgmt,
  formatCurrency,
} from "@/lib/mock-data"
import type { Patient, ChargeEntry as ChargeEntryType, LineItem } from "@/lib/types"

interface ChargeEntryProps {
  patient: Patient
  chargeEntry: ChargeEntryType | null
  onUpdateChargeEntry: (entry: ChargeEntryType) => void
  onBack: () => void
  onNext: () => void
}

export function ChargeEntry({ patient, chargeEntry, onUpdateChargeEntry, onBack, onNext }: ChargeEntryProps) {
  const [attendingPhysician, setAttendingPhysician] = useState(chargeEntry?.attending_physician || "")
  const [attendingDoctorId, setAttendingDoctorId] = useState(chargeEntry?.attending_doctor_id || "")
  const [wardRoom, setWardRoom] = useState(chargeEntry?.ward_room || patient.ward_room)
  const [dateOfAdmission, setDateOfAdmission] = useState(chargeEntry?.date_of_admission || "2024-03-20")
  const [dateOfDischarge, setDateOfDischarge] = useState(chargeEntry?.date_of_discharge || "2024-03-23")
  const [lineItems, setLineItems] = useState<LineItem[]>(
    chargeEntry?.line_items || [
      ...mockServicesFromAdmin.slice(0, 3),
      ...mockMedicationsFromInventory.slice(0, 2),
      ...mockDoctorFeesFromStaffMgmt.slice(0, 1),
    ]
  )

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)

  useEffect(() => {
    onUpdateChargeEntry({
      patient_id: patient.patient_id,
      patient_name: patient.full_name,
      attending_physician: attendingPhysician,
      attending_doctor_id: attendingDoctorId,
      ward_room: wardRoom,
      date_of_admission: dateOfAdmission,
      date_of_discharge: dateOfDischarge,
      line_items: lineItems,
      subtotal,
    })
  }, [attendingPhysician, attendingDoctorId, wardRoom, dateOfAdmission, dateOfDischarge, lineItems, patient, subtotal, onUpdateChargeEntry])

  const handlePhysicianChange = (value: string) => {
    const physician = mockPhysicians.find((p) => p.id === value)
    if (physician) {
      setAttendingPhysician(physician.name)
      setAttendingDoctorId(physician.id)
    }
  }

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems]
    const item = { ...updated[index] }
    
    if (field === "quantity" || field === "unit_price") {
      item[field] = Number(value)
      item.total = item.quantity * item.unit_price
    } else if (field === "item_name") {
      item.item_name = value as string
    }
    
    updated[index] = item
    setLineItems(updated)
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `NEW-${Date.now()}`,
      category: "service",
      item_name: "New Item",
      quantity: 1,
      unit_price: 0,
      total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "service":
        return "Service"
      case "medication":
        return "Medication"
      case "fee":
        return "Fee"
      default:
        return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "service":
        return "bg-blue-100 text-blue-800"
      case "medication":
        return "bg-green-100 text-green-800"
      case "fee":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Patient ID</Label>
              <Input value={patient.patient_id} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Patient Name</Label>
              <Input value={patient.full_name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Attending Physician</Label>
              <Select value={attendingDoctorId} onValueChange={handlePhysicianChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select physician" />
                </SelectTrigger>
                <SelectContent>
                  {mockPhysicians.map((physician) => (
                    <SelectItem key={physician.id} value={physician.id}>
                      {physician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ward / Room Number</Label>
              <Input value={wardRoom} onChange={(e) => setWardRoom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date of Admission</Label>
              <Input
                type="date"
                value={dateOfAdmission}
                onChange={(e) => setDateOfAdmission(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Discharge</Label>
              <Input
                type="date"
                value={dateOfDischarge}
                onChange={(e) => setDateOfDischarge(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Running Subtotal</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(subtotal)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Category</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="w-[100px] text-right">Qty</TableHead>
                  <TableHead className="w-[140px] text-right">Unit Price</TableHead>
                  <TableHead className="w-[140px] text-right">Total</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                        {getCategoryLabel(item.category)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.item_name}
                        onChange={(e) => updateLineItem(index, "item_name", e.target.value)}
                        className="h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        className="h-8 text-right"
                        min="1"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(index, "unit_price", e.target.value)}
                        className="h-8 text-right"
                        min="0"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button variant="outline" onClick={addLineItem} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!attendingPhysician || lineItems.length === 0} size="lg">
          Continue to Tax Computation
        </Button>
      </div>
    </div>
  )
}
