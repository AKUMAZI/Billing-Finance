import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, unauthorizedResponse, getDeprecationWarningHeader } from "@/lib/auth"

// Note: In production, this would fetch from a database
// For now, it references the in-memory store from the parent route
// This is a temporary solution - replace with actual database queries

interface RouteContext {
  params: Promise<{ invoiceId: string }>
}

// Helper to access the invoices store
// In production, import from a database service
let invoicesStore: Record<string, any> = {}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = validateApiKey(request, { routeName: "/api/invoices/[invoiceId]" })
  if (!authResult.isValid) {
    return unauthorizedResponse()
  }

  const headers = authResult.requiresWarning ? getDeprecationWarningHeader() : {}

  try {
    const { invoiceId } = await context.params

    if (!invoiceId) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "MISSING_REQUIRED_FIELDS",
          message: "Invoice ID is required",
        },
        { status: 400, headers }
      )
    }

    // In production, query the database
    // For now, we'll return a sample response structure
    // TODO: Replace with actual database query
    const invoice = invoicesStore[invoiceId]

    if (!invoice) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "NOT_FOUND",
          message: `Invoice with id ${invoiceId} not found`,
          details: { invoiceId },
        },
        { status: 404, headers }
      )
    }

    return NextResponse.json(
      {
        status: "success",
        data: {
          invoice,
        },
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json(
      {
        status: "error",
        error_code: "SYSTEM_FAILURE",
        message: "Failed to fetch invoice",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: 500, headers }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = validateApiKey(request, { routeName: "/api/invoices/[invoiceId]" })
  if (!authResult.isValid) {
    return unauthorizedResponse()
  }

  const headers = authResult.requiresWarning ? getDeprecationWarningHeader() : {}

  try {
    const { invoiceId } = await context.params

    if (!invoiceId) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "MISSING_REQUIRED_FIELDS",
          message: "Invoice ID is required",
        },
        { status: 400, headers }
      )
    }

    // Check if invoice exists
    const invoice = invoicesStore[invoiceId]
    if (!invoice) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "NOT_FOUND",
          message: `Invoice with id ${invoiceId} not found`,
          details: { invoiceId },
        },
        { status: 404, headers }
      )
    }

    // Delete the invoice
    delete invoicesStore[invoiceId]

    return NextResponse.json(
      {
        status: "success",
        message: `Invoice ${invoiceId} deleted successfully`,
        data: { invoiceId },
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json(
      {
        status: "error",
        error_code: "SYSTEM_FAILURE",
        message: "Failed to delete invoice",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: 500, headers }
    )
  }
}
