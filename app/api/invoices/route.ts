import { NextRequest, NextResponse } from "next/server"

// In-memory storage for invoices (in production, this would be a database)
let invoicesStore: Record<string, any> = {}

// API Key validation - this will be set via environment variable
function getApiKey(): string {
  const key = process.env.INVOICES_API_KEY
  if (!key) {
    console.warn("[v0] INVOICES_API_KEY environment variable is not set!")
  }
  return key || ""
}

function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")
  const expectedKey = getApiKey()
  console.log("[v0] API Key validation - Received:", apiKey ? apiKey.substring(0, 10) + "..." : "missing")
  console.log("[v0] API Key validation - Expected:", expectedKey ? expectedKey.substring(0, 10) + "..." : "not set")
  return apiKey === expectedKey && expectedKey !== ""
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      status: "error",
      error_code: "UNAUTHORIZED",
      message: "Invalid or missing API key",
    },
    { status: 401 }
  )
}



// Invoice creation/storage endpoint
export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()

    // Validate required fields following PMS invoice structure
    const requiredFields = [
      "invoice_id",
      "patient_id",
      "patient_name",
      "items",
      "total_amount",
    ]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "MISSING_REQUIRED_FIELDS",
          message: `Missing required fields: ${missingFields.join(", ")}`,
          details: { missingFields },
        },
        { status: 400 }
      )
    }

    // Normalize the invoice data to PMS invoice structure
    const invoice = {
      _id: body._id || body.invoice_id,
      invoice_id: body.invoice_id,
      patient_id: body.patient_id,
      patient_name: body.patient_name,
      health_record_id: body.health_record_id || body.invoice_id,
      diagnosis: body.diagnosis || "",
      items: body.items || [], // Array of { medicineId, medicineName, prescribedDosage, prescribedQuantity, unitPrice, totalPrice }
      prescription_names: body.prescription_names || [],
      is_released: body.is_released !== undefined ? body.is_released : false,
      total_amount: body.total_amount,
      invoice_date: body.invoice_date || new Date().toISOString(),
      status: body.status || "pending", // "pending" | "paid" | "cancelled" | "refunded"
      created_by: body.created_by || "system",
      created_at: body.created_at || new Date().toISOString(),
      updated_at: body.updated_at || new Date().toISOString(),
      updated_by: body.updated_by,
    }

    // Store the invoice
    invoicesStore[invoice.invoice_id] = invoice

    return NextResponse.json(
      {
        status: "success",
        message: "Invoice created successfully",
        data: {
          invoice,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      {
        status: "error",
        error_code: "SYSTEM_FAILURE",
        message: "Failed to create invoice",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: 500 }
    )
  }
}

// Retrieve invoices
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const patientId = searchParams.get("patient_id")

  try {
    // Filter invoices based on query parameters
    let filteredInvoices = Object.values(invoicesStore)

    if (patientId) {
      filteredInvoices = filteredInvoices.filter(
        (inv) => inv.patient_id === patientId
      )
    }

    // Pagination
    const total = filteredInvoices.length
    const pages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const invoices = filteredInvoices.slice(start, start + limit)

    return NextResponse.json({
      status: "success",
      results: invoices.length,
      data: {
        invoices,
      },
      pagination: {
        limit,
        page,
        pages,
        total,
      },
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      {
        status: "error",
        error_code: "SYSTEM_FAILURE",
        message: "Failed to fetch invoices",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: 500 }
    )
  }
}

// Update invoice status
export async function PATCH(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse()
  }

  try {
    const body = await request.json()
    const { invoice_id, status } = body

    if (!invoice_id || !status) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "MISSING_REQUIRED_FIELDS",
          message: "invoice_id and status are required",
          details: { missingFields: !invoice_id ? ["invoice_id"] : ["status"] },
        },
        { status: 400 }
      )
    }

    // Check if invoice exists
    const invoice = invoicesStore[invoice_id]
    if (!invoice) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "NOT_FOUND",
          message: `Invoice with id ${invoice_id} not found`,
          details: { invoice_id },
        },
        { status: 404 }
      )
    }

    // Update the invoice
    invoice.status = status
    invoice.updated_at = new Date().toISOString()
    invoice.updated_by = body.updated_by || "system"

    return NextResponse.json({
      status: "success",
      message: "Invoice updated successfully",
      data: {
        invoice,
      },
    })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      {
        status: "error",
        error_code: "SYSTEM_FAILURE",
        message: "Failed to update invoice",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: 500 }
    )
  }
}
