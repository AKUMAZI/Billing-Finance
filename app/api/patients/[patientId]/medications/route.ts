import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const PMS_INVOICES_API_BASE_URL =
  process.env.PMS_INVOICES_API_BASE_URL?.trim() ||
  "https://pms-backend-kohl.vercel.app/api/v1/external/invoices"

const PMS_INVOICES_API_KEY = process.env.PMS_INVOICES_API_KEY?.trim()

function parseIsoLikeDate(value: unknown): number {
  if (typeof value !== "string") return 0
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : 0
}

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
      // PMS can return multiple invoices per patient. For charge entry, we want
      // the *current/latest* prescription set (not a union across historical invoices),
      // otherwise meds appear duplicated with mismatched quantities.
      const latestInvoice = [...invoices]
        .filter((inv: any) => Array.isArray(inv?.items) && inv?.items?.length > 0)
        .sort((a: any, b: any) => {
          const ad = parseIsoLikeDate(a?.invoice_date) || parseIsoLikeDate(a?.updated_at) || parseIsoLikeDate(a?.created_at)
          const bd = parseIsoLikeDate(b?.invoice_date) || parseIsoLikeDate(b?.updated_at) || parseIsoLikeDate(b?.created_at)
          return bd - ad
        })[0]

      const items = latestInvoice?.items
      if (Array.isArray(items)) {
        // Deduplicate within the invoice (sometimes PMS repeats the same medication item).
        const aggregated = new Map<
          string,
          {
            id: string
            medicineName: string
            dosage: string
            quantity: number
            frequency: string
            prescriptionDate: string
            unitPrice?: number
            totalPrice?: number
          }
        >()

        for (const item of items) {
          const medicineName =
            item?.medicineName ||
            item?.medicine_name ||
            item?.name ||
            item?.serviceName ||
            "Unknown"

          const dosage = item?.prescribedDosage || item?.dosage || ""
          const key = `${String(item?.medicineId ?? medicineName).trim().toLowerCase()}|${String(dosage).trim().toLowerCase()}`

          const rawQty = item?.prescribedQuantity ?? item?.quantity ?? 1
          const qty = Number(rawQty)
          const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1

          const unitPrice = typeof item?.unitPrice === "number" ? item.unitPrice : undefined
          const totalPrice = typeof item?.totalPrice === "number" ? item.totalPrice : undefined

          const existing = aggregated.get(key)
          if (!existing) {
            aggregated.set(key, {
              id: `INV-${latestInvoice?.invoice_id ?? latestInvoice?._id ?? patientId}-${aggregated.size}`,
              medicineName,
              dosage,
              quantity,
              frequency: item?.frequency || "N/A",
              prescriptionDate:
                latestInvoice?.invoice_date ||
                latestInvoice?.updated_at ||
                latestInvoice?.created_at ||
                new Date().toISOString(),
              unitPrice,
              totalPrice,
            })
            continue
          }

          existing.quantity += quantity
          if (typeof existing.totalPrice === "number" && typeof totalPrice === "number") {
            existing.totalPrice += totalPrice
          } else if (typeof totalPrice === "number") {
            existing.totalPrice = totalPrice
          }
          if (existing.unitPrice === undefined && typeof unitPrice === "number") {
            existing.unitPrice = unitPrice
          }
        }

        medications.push(...aggregated.values())
      }
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
