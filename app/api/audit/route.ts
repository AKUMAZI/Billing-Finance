import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, unauthorizedResponse, getDeprecationWarningHeader } from "@/lib/auth"
import { postAdminAuditIngest, resolveAuditUserId } from "@/lib/admin-audit-ingest"

export async function POST(request: NextRequest) {
  const authResult = validateApiKey(request, { routeName: "/api/audit", requireApiKey: false })
  if (!authResult.isValid) {
    return unauthorizedResponse()
  }

  const headers = authResult.requiresWarning ? getDeprecationWarningHeader() : {}

  try {
    const body = (await request.json()) as Record<string, unknown>

    const action_type = body.action_type != null ? String(body.action_type).trim() : ""
    const details = body.details != null ? String(body.details).trim() : ""
    const subsystem = body.subsystem != null ? String(body.subsystem).trim() : ""

    if (!action_type || !details || !subsystem) {
      return NextResponse.json(
        {
          error: "Missing required fields: action_type, details, subsystem",
          hint: "user_id is optional if ADMIN_AUDIT_USER_ID is set.",
        },
        { status: 400, headers },
      )
    }

    const user_id = resolveAuditUserId(body.user_id != null ? String(body.user_id) : undefined)

    const result = await postAdminAuditIngest(request, {
      user_id,
      action_type,
      details,
      subsystem,
      ip_addr: body.ip_addr != null ? String(body.ip_addr) : undefined,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: "Failed to send audit log", details: result.error },
        { status: result.status >= 400 ? result.status : 502, headers },
      )
    }

    return NextResponse.json({ success: true }, { headers })
  } catch (error) {
    console.error("Error sending audit log:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers }
    )
  }
}
