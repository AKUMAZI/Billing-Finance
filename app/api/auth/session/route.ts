import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, unauthorizedResponse } from "@/lib/auth"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const authResult = validateApiKey(request, { routeName: "/api/auth/session" })
  if (!authResult.isValid) {
    return unauthorizedResponse()
  }

  return NextResponse.json({ authenticated: true })
}

