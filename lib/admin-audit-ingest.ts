import type { NextRequest } from "next/server"

const DEFAULT_INGEST_URL = "https://admin-subystem.onrender.com/admin/api/audit/ingest"

/** Billing subsystem principal registered in Admin (overridable via ADMIN_AUDIT_USER_ID). */
const DEFAULT_BILLING_SUBSYSTEM_AUDIT_USER_ID = "559aeac3-d5cb-4941-ba29-4670a2f23869"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

export type AdminAuditIngestPayload = {
  user_id: string
  action_type: string
  details: string
  ip_addr: string
  subsystem: string
}

/** Prefer first hop from proxies (Vercel, nginx, etc.). */
export function getClientIpFromRequest(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get("x-real-ip")?.trim()
  if (realIp) return realIp
  return "0.0.0.0"
}

/**
 * Admin audit requires `user_id` to exist in Admin users. Prefer ADMIN_AUDIT_USER_ID, else a
 * valid UUID from the caller, else the Billing subsystem default registered in Admin.
 */
export function resolveAuditUserId(bodyUserId?: string | null): string {
  const envId = process.env.ADMIN_AUDIT_USER_ID?.trim()
  if (envId && isUuid(envId)) return envId
  const u = bodyUserId?.trim()
  if (u && isUuid(u)) return u
  return DEFAULT_BILLING_SUBSYSTEM_AUDIT_USER_ID
}

export type PostAdminAuditInput = {
  user_id?: string | null
  action_type: string
  details: string
  subsystem: string
  /** If set and not a placeholder, used instead of deriving from the request. */
  ip_addr?: string | null
}

/**
 * POST to admin subsystem audit ingest (same shape as Postman example).
 * Uses AUDIT_BASE_URL (optional) and AUDIT_API_KEY (sent as x-subsystem-key).
 */
/** Same key is often duplicated as AUDIT_API_KEY or ADMIN_API_KEY in env. */
export function resolveAuditApiKey(): string | undefined {
  const candidates = [
    process.env.AUDIT_API_KEY,
    process.env.ADMIN_API_KEY,
    process.env.AUDIT_SUBSYSTEM_KEY,
  ]
  for (const c of candidates) {
    const t = c?.trim()
    if (t) return t
  }
  return undefined
}

export async function postAdminAuditIngest(
  request: NextRequest | null,
  partial: PostAdminAuditInput,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const baseUrl = process.env.AUDIT_BASE_URL?.trim() || DEFAULT_INGEST_URL
  const apiKey = resolveAuditApiKey()
  if (!apiKey) {
    console.error("[admin-audit] No API key: set AUDIT_API_KEY or ADMIN_API_KEY")
    return { ok: false, status: 500, error: "AUDIT_API_KEY / ADMIN_API_KEY not configured" }
  }

  const rawIp = partial.ip_addr?.trim()
  const ip_addr =
    rawIp && rawIp !== "0.0.0.0"
      ? rawIp
      : request
        ? getClientIpFromRequest(request)
        : "0.0.0.0"

  const payload: AdminAuditIngestPayload = {
    user_id: resolveAuditUserId(partial.user_id),
    action_type: partial.action_type.trim(),
    details: partial.details.trim(),
    ip_addr,
    subsystem: partial.subsystem.trim(),
  }

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-subsystem-key": apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("[admin-audit] ingest failed:", response.status, text)
      return { ok: false, status: response.status, error: text }
    }
    console.info("[admin-audit] ingest OK:", baseUrl, response.status)
    return { ok: true, status: response.status }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[admin-audit] ingest error:", msg)
    return { ok: false, status: 500, error: msg }
  }
}
