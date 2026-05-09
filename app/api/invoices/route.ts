import { NextRequest, NextResponse } from "next/server"

const PMS_INVOICES_API_URL = "https://pms-backend-kohl.vercel.app/api/v1/external/invoices"
const PMS_INVOICES_API_KEY = process.env.PMS_INVOICES_API_KEY

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get("page") || "1"
  const limit = searchParams.get("limit") || "10"
  const patientId = searchParams.get("patient_id")
  const fresh = searchParams.get("fresh") === "1"

  if (!PMS_INVOICES_API_KEY) {
    return NextResponse.json(
      { error: "PMS_INVOICES_API_KEY is not configured" },
      { status: 500 }
    )
  }

  try {
    const url = new URL(PMS_INVOICES_API_URL)
    url.searchParams.set("page", page)
    url.searchParams.set("limit", limit)
    if (patientId) {
      url.searchParams.set("patient_id", patientId)
    }

    const response = await fetch(url.toString(), {
      headers: {
        "x-api-key": PMS_INVOICES_API_KEY,
        "Content-Type": "application/json",
      },
      next: { revalidate: fresh ? 0 : 60 },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PMS Invoices API error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to fetch invoices from PMS" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  if (!PMS_INVOICES_API_KEY) {
    return NextResponse.json(
      { error: "PMS_INVOICES_API_KEY is not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { invoice_id, status } = body

    if (!invoice_id || !status) {
      return NextResponse.json(
        { error: "invoice_id and status are required" },
        { status: 400 }
      )
    }

    const response = await fetch(`${PMS_INVOICES_API_URL}/${invoice_id}`, {
      method: "PATCH",
      headers: {
        "x-api-key": PMS_INVOICES_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("PMS Invoices API PATCH error:", response.status, errorText)
      return NextResponse.json(
        { error: "Failed to update invoice status" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
