import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

const ADMIN_LOGIN_URL =
  process.env.ADMIN_BASE_URL?.trim() ||
  process.env.ADMIN_LOGIN_URL?.trim() ||
  "https://admin-subystem.onrender.com/admin/api/auth/subsystem-login"
const ADMIN_API_KEY = process.env.ADMIN_API_KEY?.trim() || process.env.AUDIT_API_KEY?.trim()

function formEncode(fields: Record<string, string>) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(fields)) params.set(k, v)
  return params.toString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = String(body?.username ?? "")
    const password = String(body?.password ?? "")
    const subsystem = String(body?.subsystem ?? "Billing")

    if (!username || !password) {
      return NextResponse.json(
        { status: "error", message: "Missing username or password" },
        { status: 400 }
      )
    }

    const bodyPayload = {
      username,
      password,
      subsystem,
      // mirror backend typo contract if required by upstream:
      subsytem: subsystem,
    }

    // Some envs still point to older protected audit endpoints. Try the configured
    // URL first, then fallback to the verified auth route.
    const attemptUrls = Array.from(
      new Set([
        ADMIN_LOGIN_URL,
        "https://admin-subystem.onrender.com/admin/api/auth/subsystem-login",
      ])
    )

    let lastStatus = 500
    let lastPayload: unknown = { message: "Unknown login error" }
    let lastUrl = attemptUrls[0]

    for (const url of attemptUrls) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ADMIN_API_KEY ? { "x-subsystem-key": ADMIN_API_KEY } : {}),
        },
        body: JSON.stringify(bodyPayload),
      })

      const contentType = response.headers.get("content-type") || ""
      const payload = contentType.includes("application/json") ? await response.json() : await response.text()

      if (response.ok) {
        return NextResponse.json(
          { status: "success", data: payload, meta: { upstream: url } },
          { status: 200 }
        )
      }

      lastStatus = response.status
      lastPayload = payload
      lastUrl = url
    }

    return NextResponse.json(
      {
        status: "error",
        message: "Login failed",
        details: lastPayload,
        upstream_status: lastStatus,
        upstream_url: lastUrl,
      },
      { status: lastStatus }
    )
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Server error during login", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

