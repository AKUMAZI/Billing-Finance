import { NextRequest, NextResponse } from "next/server"

// In-memory storage for invoices (in production, this would be a database)
let invoicesStore: Record<string, any> = {}

// Initialize with sample data
function initializeInvoices() {
  const sampleInvoices = [
    {
      _id: "69fade16d85945701a0f5f94",
      invoice_id: "INV-1l-moto6sxo",
      patient_id: "PAT-20260506-0030",
      patient_name: "Isabella Nguyen",
      health_record_id: "",
      items: [
        {
          medicineId: "MED0002",
          medicineName: "Cetirizine",
          prescribedDosage: "10mg",
          prescribedQuantity: 15,
          unitPrice: 12.5,
          totalPrice: 187.5,
        },
      ],
      prescription_names: [],
      variable: {
        insurance: {
          provider: "FamilyHealth Insurance",
          coverage_percentage: 95,
          policy_number: "HMO-POL-00030",
          group_number: "HMO-GRP-006",
        },
      },
      is_released: true,
      total_amount: 187.5,
      invoice_date: "2026-05-01T16:00:00.000Z",
      status: "paid",
      created_by: "admin",
      created_at: "2026-05-06T06:22:14.826Z",
      updated_at: "2026-05-06T06:58:23.509Z",
      updated_by: "1777432837989",
    },
    {
      _id: "69fade16d85945701a0f5f8f",
      invoice_id: "INV-1g-moto6swi",
      patient_id: "PAT-20260506-0027",
      patient_name: "John Kim",
      health_record_id: "",
      items: [
        {
          medicineId: "MED0002",
          medicineName: "Cetirizine",
          prescribedDosage: "10mg",
          prescribedQuantity: 10,
          unitPrice: 12.5,
          totalPrice: 125,
        },
        {
          medicineId: "MED0003",
          medicineName: "Amoxicillin",
          prescribedDosage: "250mg",
          prescribedQuantity: 19,
          unitPrice: 18,
          totalPrice: 342,
        },
      ],
      prescription_names: [],
      variable: {
        insurance: {
          provider: "CareShield",
          coverage_percentage: 70,
          policy_number: "PPO-POL-00027",
          group_number: "PPO-GRP-003",
        },
      },
      is_released: true,
      total_amount: 467,
      invoice_date: "2026-04-29T16:00:00.000Z",
      status: "paid",
      created_by: "admin",
      created_at: "2026-05-06T06:22:14.826Z",
      updated_at: "2026-05-06T07:00:18.609Z",
      updated_by: "1777432837989",
    },
    {
      _id: "69fade16d85945701a0f5f9a",
      invoice_id: "INV-1r-moto6syv",
      patient_id: "PAT-20260506-0033",
      patient_name: "Maria Hernandez",
      health_record_id: "",
      items: [
        {
          medicineId: "MED0002",
          medicineName: "Cetirizine",
          prescribedDosage: "10mg",
          prescribedQuantity: 10,
          unitPrice: 12.5,
          totalPrice: 125,
        },
      ],
      prescription_names: [],
      variable: {
        insurance: {
          provider: "HealthFirst Ins.",
          coverage_percentage: 80,
          policy_number: "HMO-POL-00033",
          group_number: "HMO-GRP-009",
        },
      },
      is_released: false,
      total_amount: 125,
      invoice_date: "2026-04-28T16:00:00.000Z",
      status: "pending",
      created_by: "admin",
      created_at: "2026-05-06T06:22:14.827Z",
      updated_at: "2026-05-06T06:22:14.827Z",
    },
    {
      _id: "69fade16d85945701a0f5fd0",
      invoice_id: "INV-39-moto6t7z",
      patient_id: "PAT-20260506-0056",
      patient_name: "Sarah Davis",
      health_record_id: "",
      items: [
        {
          medicineId: "MED0005",
          medicineName: "Metformin",
          prescribedDosage: "500mg",
          prescribedQuantity: 14,
          unitPrice: 7.5,
          totalPrice: 105,
        },
      ],
      prescription_names: [],
      variable: {
        insurance: {
          provider: "Unity Health Cover",
          coverage_percentage: 75,
          policy_number: "EPO-POL-00056",
          group_number: "EPO-GRP-008",
        },
      },
      is_released: false,
      total_amount: 105,
      invoice_date: "2026-04-26T16:00:00.000Z",
      status: "paid",
      created_by: "admin",
      created_at: "2026-05-06T06:22:14.827Z",
      updated_at: "2026-05-06T06:22:14.827Z",
    },
    {
      _id: "69fade16d85945701a0f5f98",
      invoice_id: "INV-1p-moto6sy3",
      patient_id: "PAT-20260506-0031",
      patient_name: "Chen Johnson",
      health_record_id: "",
      items: [
        {
          medicineId: "MED0005",
          medicineName: "Metformin",
          prescribedDosage: "500mg",
          prescribedQuantity: 23,
          unitPrice: 7.5,
          totalPrice: 172.5,
        },
        {
          medicineId: "MED-352928",
          medicineName: "Senku",
          prescribedDosage: "600",
          prescribedQuantity: 16,
          unitPrice: 6,
          totalPrice: 96,
        },
      ],
      prescription_names: [],
      variable: {
        insurance: {
          provider: "PremierCare",
          coverage_percentage: 95,
          policy_number: "POS-POL-00031",
          group_number: "POS-GRP-007",
        },
      },
      is_released: false,
      total_amount: 268.5,
      invoice_date: "2026-04-26T16:00:00.000Z",
      status: "paid",
      created_by: "admin",
      created_at: "2026-05-06T06:22:14.826Z",
      updated_at: "2026-05-06T06:22:14.826Z",
    },
  ]

  sampleInvoices.forEach((invoice) => {
    invoicesStore[invoice.invoice_id] = invoice
  })
}

// Initialize on first load
initializeInvoices()

// Invoice creation/storage endpoint
export async function POST(request: NextRequest) {
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
