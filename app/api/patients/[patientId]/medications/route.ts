import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const PMS_INVOICES_API_BASE_URL =
  process.env.PMS_INVOICES_API_BASE_URL?.trim() ||
  "https://pms-backend-kohl.vercel.app/api/v1/external/invoices"

const PMS_INVOICES_API_KEY = process.env.PMS_INVOICES_API_KEY?.trim()

export interface PatientMedication {
  id: string
  medicineName: string
  dosage: string
  quantity: number
  frequency: string
  prescriptionDate: string
  unitPrice?: number
  totalPrice?: number
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

    if (!PMS_INVOICES_API_KEY) {
      return NextResponse.json(
        {
          status: "error",
          error: "Missing PMS_INVOICES_API_KEY configuration",
        },
        { status: 500 }
      )
    }

    const url = new URL(PMS_INVOICES_API_BASE_URL)
    url.searchParams.set("patient_id", patientId)
    url.searchParams.set("page", "1")
    url.searchParams.set("limit", "20")

    const pmsResponse = await fetch(url.toString(), {
      headers: {
        "x-api-key": PMS_INVOICES_API_KEY,
        "Content-Type": "application/json",
      },
    })

    if (!pmsResponse.ok) {
      return NextResponse.json(
        {
          status: "error",
          error: "Failed to fetch patient invoices from PMS",
        },
        { status: pmsResponse.status }
      )
    }

    const invoicesPayload = await pmsResponse.json()
    const invoices = invoicesPayload?.data?.invoices

    const medications: PatientMedication[] = []

    if (Array.isArray(invoices)) {
      invoices.forEach((inv: any) => {
        const items = inv?.items
        if (!Array.isArray(items)) return

        items.forEach((item: any, index: number) => {
          const medicineName =
            item?.medicineName ||
            item?.medicine_name ||
            item?.name ||
            item?.serviceName ||
            "Unknown"

          const dosage = item?.prescribedDosage || item?.dosage || ""
          const rawQty = item?.prescribedQuantity ?? item?.quantity ?? 1
          const quantity = Number(rawQty)
          const unitPrice = typeof item?.unitPrice === "number" ? item.unitPrice : undefined
          const totalPrice = typeof item?.totalPrice === "number" ? item.totalPrice : undefined

          medications.push({
            id: `INV-${inv?.invoice_id ?? inv?._id ?? patientId}-${index}`,
            medicineName,
            dosage,
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
            frequency: item?.frequency || "N/A",
            prescriptionDate: inv?.invoice_date || inv?.created_at || new Date().toISOString(),
            unitPrice,
            totalPrice,
          })
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
