import { NextRequest, NextResponse } from "next/server"

const PMS_API_URL = "https://pms-backend-kohl.vercel.app/api/v1/external"
const PMS_API_KEY = process.env.PMS_API_KEY

export interface PatientMedication {
  id: string
  medicineName: string
  dosage: string
  quantity: number
  frequency: string
  prescriptionDate: string
}

export interface PatientMedicationsResponse {
  status: string
  data: {
    patientId: string
    medications: PatientMedication[]
  }
}

interface RouteContext {
  params: Promise<{ patientId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { patientId } = await context.params

    // Fetch patient details from PMS
    const pmsResponse = await fetch(`${PMS_API_URL}/patients/${patientId}`, {
      headers: {
        "x-api-key": PMS_API_KEY || "",
        "Content-Type": "application/json",
      },
    })

    if (!pmsResponse.ok) {
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch patient data from PMS",
        },
        { status: pmsResponse.status }
      )
    }

    const patientData = await pmsResponse.json()

    // Extract medications from patient data
    // The structure depends on how PMS returns the data
    const medications: PatientMedication[] = []
    
    if (patientData.data?.current_medications && Array.isArray(patientData.data.current_medications)) {
      patientData.data.current_medications.forEach((med: any, index: number) => {
        medications.push({
          id: `MED-${patientId}-${index}`,
          medicineName: med.medicine_name || med.name || "Unknown",
          dosage: med.dosage || med.prescribed_dosage || "Unknown",
          quantity: med.quantity || med.prescribed_quantity || 1,
          frequency: med.frequency || "Once Daily",
          prescriptionDate: med.prescription_date || new Date().toISOString(),
        })
      })
    }

    return NextResponse.json({
      status: "success",
      data: {
        patientId,
        medications,
      },
    })
  } catch (error) {
    console.error("Error fetching patient medications:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
