import { NextRequest, NextResponse } from "next/server"
import { validateApiKey, unauthorizedResponse, getDeprecationWarningHeader } from "@/lib/auth"
import { deleteInvoice, getInvoice } from "@/lib/invoices-store"

const PMS_INVOICES_API_BASE_URL =
  process.env.PMS_INVOICES_API_BASE_URL?.trim() ||
  "https://pms-backend-kohl.vercel.app/api/v1/external/invoices"

const PMS_INVOICES_API_KEY = process.env.PMS_INVOICES_API_KEY?.trim()

/** PMS sometimes returns HTTP 200 with { status: "fail", message: "..." } — treat as failure. */
function isPmsNegativePayload(data: unknown): boolean {
  if (data == null || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  const st = d.status
  if (st === "fail" || st === "error" || st === false) return true
  if (d.success === false) return true
  const msg = typeof d.message === "string" ? d.message : ""
  if (/not found/i.test(msg)) return true
  return false
}

async function tryPatchPmsInvoiceOnce(
  pmsInvoiceId: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; statusCode: number; data: unknown }> {
  if (!PMS_INVOICES_API_KEY) {
    return { ok: false, statusCode: 500, data: { error: "Missing PMS_INVOICES_API_KEY configuration" } }
  }

  const url = `${PMS_INVOICES_API_BASE_URL}/${encodeURIComponent(pmsInvoiceId)}`

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PMS_INVOICES_API_KEY,
    },
    body: JSON.stringify(body),
  })

  const text = await response.text().catch(() => "")
  let data: unknown = text
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // keep raw text
  }

  const httpOk = response.ok && response.status >= 200 && response.status < 300
  const logicallyOk = httpOk && !isPmsNegativePayload(data)

  return { ok: logicallyOk, statusCode: response.status, data }
}

/** Try many body shapes; PMS returns 200 + { status: "fail" } until the right shape matches. */
async function tryPatchPmsInvoice(
  pmsInvoiceId: string,
  status: string,
): Promise<{ ok: boolean; statusCode: number; data: unknown }> {
  const lower = status.toLowerCase()
  const attempts: Record<string, unknown>[] = [{ status: lower }]

  if (lower === "paid") {
    attempts.push(
      { status: "paid" },
      { status: "Paid" },
      { status: "paid", is_released: true },
      { payment_status: "Paid" },
      { payment_status: "paid" },
      { invoice_status: "paid" },
      { status: "paid", payment_status: "Paid" },
      { paid: true },
      { is_paid: true },
    )
  }

  let last: { ok: boolean; statusCode: number; data: unknown } = {
    ok: false,
    statusCode: 500,
    data: null,
  }

  for (const body of attempts) {
    last = await tryPatchPmsInvoiceOnce(pmsInvoiceId, body)
    if (last.ok) return last
    // Wrong resource id — don't spam variants
    if (last.statusCode === 404) return last
    // Retry other bodies on client errors or "logical" failures (incl. 200 + status:fail)
    if (last.statusCode >= 500) return last
  }

  return last
}

/** PATCH using Mongo _id first, then PMS invoice_id in path if different (some deployments route by business id). */
async function patchPmsInvoiceStatusWithPathFallbacks(
  mongoId: string,
  alternatePathId: string | undefined,
  status: string,
): Promise<{ ok: boolean; statusCode: number; data: unknown }> {
  const r = await tryPatchPmsInvoice(mongoId, status)
  if (r.ok) return r

  const alt = alternatePathId?.trim()
  if (alt && alt !== mongoId) {
    return tryPatchPmsInvoice(alt, status)
  }

  return r
}

function parseInvoiceListPayload(payload: Record<string, unknown> | null): unknown[] {
  if (!payload) return []
  const data = payload.data
  if (Array.isArray(data)) return data
  if (data && typeof data === "object" && Array.isArray((data as { invoices?: unknown[] }).invoices)) {
    return (data as { invoices: unknown[] }).invoices
  }
  if (Array.isArray(payload.invoices)) return payload.invoices
  return []
}

async function fetchPmsInvoicesPage(patientId: string, page: number, limit: number): Promise<unknown[]> {
  if (!PMS_INVOICES_API_KEY) return []

  const url = new URL(PMS_INVOICES_API_BASE_URL)
  url.searchParams.set("patient_id", patientId)
  url.searchParams.set("page", String(page))
  url.searchParams.set("limit", String(limit))

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PMS_INVOICES_API_KEY,
    },
  })

  if (!response.ok) return []

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null
  return parseInvoiceListPayload(payload)
}

/** List all prescription invoices for a patient from PMS (paginated). */
async function fetchAllPmsInvoicesForPatient(patientId: string): Promise<unknown[]> {
  const all: unknown[] = []
  const pageSize = 100
  for (let page = 1; page <= 20; page += 1) {
    const chunk = await fetchPmsInvoicesPage(patientId, page, pageSize)
    if (chunk.length === 0) break
    all.push(...chunk)
    if (chunk.length < pageSize) break
  }
  return all
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

type PmsInvoiceMatch = {
  mongoId: string
  /** PMS `invoice_id` from list — some deployments expect this in PATCH URL instead of `_id`. */
  pmsInvoiceKey?: string
}

/**
 * Match Billing's ids to a row returned by PMS list, then return that row's `_id`
 * (and human-readable invoice id for alternate PATCH paths).
 */
function resolvePmsInvoiceMatch(
  idFromUrl: string,
  invoicePayload: { invoice_id?: string; _id?: string } | undefined,
  invoices: unknown[],
): PmsInvoiceMatch | null {
  if (!Array.isArray(invoices)) return null

  const candidates = new Set<string>()
  const add = (v: string | undefined | null) => {
    if (!v) return
    const s = String(v).trim()
    if (s) candidates.add(s)
    try {
      const d = decodeURIComponent(s)
      if (d) candidates.add(d)
    } catch {
      /* ignore */
    }
  }

  add(idFromUrl)
  try {
    add(decodeURIComponent(idFromUrl))
  } catch {
    /* ignore */
  }
  if (invoicePayload?.invoice_id) add(String(invoicePayload.invoice_id))
  if (invoicePayload?._id) add(String(invoicePayload._id))

  const candidateNorms = new Set(Array.from(candidates).map(norm))

  const ALIAS_KEYS = [
    "invoice_id",
    "invoiceId",
    "id",
    "invoice_number",
    "prescription_id",
    "prescriptionInvoiceId",
  ] as const

  type MatchRow = { mongoId: string; pmsInvoiceKey?: string; statusRank: number }
  const matches: MatchRow[] = []

  for (const inv of invoices) {
    if (!inv || typeof inv !== "object") continue
    const rec = inv as Record<string, unknown>
    const mongoId = rec._id != null ? String(rec._id).trim() : ""
    if (!mongoId) continue

    const rawInvoiceId =
      rec.invoice_id != null && String(rec.invoice_id).trim() !== ""
        ? String(rec.invoice_id).trim()
        : undefined

    const aliases = new Set<string>([mongoId])
    for (const k of ALIAS_KEYS) {
      const v = rec[k]
      if (v != null && String(v).trim() !== "") aliases.add(String(v).trim())
    }

    let hit = false
    for (const c of candidates) {
      if (!c) continue
      for (const a of aliases) {
        if (a === c || norm(a) === norm(c)) {
          hit = true
          break
        }
      }
      if (hit) break
    }
    if (!hit) {
      for (const cn of candidateNorms) {
        if (!cn) continue
        for (const a of aliases) {
          if (norm(a) === cn) {
            hit = true
            break
          }
        }
        if (hit) break
      }
    }

    if (hit) {
      const st = norm(String(rec.status ?? ""))
      const statusRank = st === "pending" ? 0 : st === "paid" ? 2 : 1
      matches.push({
        mongoId,
        pmsInvoiceKey: rawInvoiceId,
        statusRank,
      })
    }
  }

  if (matches.length === 0) return null
  matches.sort((a, b) => a.statusRank - b.statusRank)
  const best = matches[0]
  return { mongoId: best.mongoId, pmsInvoiceKey: best.pmsInvoiceKey }
}

export const runtime = "nodejs"

export async function GET(request: NextRequest, context: RouteContext<"/api/invoices/[invoiceId]">) {
  const authResult = validateApiKey(request, { routeName: "/api/invoices/[invoiceId]", requireApiKey: false })
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

    const invoice = await getInvoice(invoiceId)

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

export async function PATCH(request: NextRequest, context: RouteContext<"/api/invoices/[invoiceId]">) {
  const authResult = validateApiKey(request, { routeName: "/api/invoices/[invoiceId]", requireApiKey: false })
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

    const body = (await request.json()) as {
      status?: string
      invoice?: { invoice_id?: string; _id?: string; patient_id?: string }
      patient_id?: string
      invoice_id?: string
      pms_document_id?: string
      updated_by?: string
    }

    const { status, invoice: invoicePayload } = body

    if (!status) {
      return NextResponse.json(
        {
          status: "error",
          error_code: "MISSING_REQUIRED_FIELDS",
          message: "status is required",
          details: { missingFields: ["status"] },
        },
        { status: 400, headers }
      )
    }

    const normalizedStatus = String(status).toLowerCase()

    const idFromUrl = decodeURIComponent(invoiceId).trim()
    const mergedPayload = {
      ...(invoicePayload ?? {}),
      _id: invoicePayload?._id ?? body.pms_document_id,
      invoice_id: invoicePayload?.invoice_id ?? body.invoice_id,
      patient_id: invoicePayload?.patient_id ?? body.patient_id,
    }

    const patientIdForLookup = mergedPayload.patient_id
      ? String(mergedPayload.patient_id).trim()
      : undefined

    // Always list PMS invoices for the patient (same source as GET), match the row, then PATCH.
    let pmsMatch: PmsInvoiceMatch | null = null
    let pmsList: unknown[] = []

    if (patientIdForLookup) {
      pmsList = await fetchAllPmsInvoicesForPatient(patientIdForLookup)
      pmsMatch = resolvePmsInvoiceMatch(idFromUrl, mergedPayload, pmsList)
      if (!pmsMatch) {
        return NextResponse.json(
          {
            status: "error",
            error_code: "NOT_FOUND",
            message:
              "No matching prescription invoice in PMS for this patient. Ensure invoice_id matches a PMS invoice.",
            details: {
              patient_id: patientIdForLookup,
              list_count: pmsList.length,
              searched: {
                path: idFromUrl,
                invoice_id: mergedPayload.invoice_id,
                _id: mergedPayload._id,
              },
            },
          },
          { status: 404, headers },
        )
      }
    } else {
      pmsMatch = { mongoId: idFromUrl }
    }

    const result = await patchPmsInvoiceStatusWithPathFallbacks(
      pmsMatch.mongoId,
      pmsMatch.pmsInvoiceKey,
      normalizedStatus,
    )

    if (!result.ok) {
      const notFound = result.statusCode === 404
      return NextResponse.json(
        {
          status: "error",
          error_code: notFound ? "NOT_FOUND" : "PMS_PATCH_FAILED",
          message: notFound
            ? "Invoice not found in PMS. Use an invoice that exists in PMS, or ensure invoice_id matches a PMS invoice for this patient."
            : "Failed to update invoice status in PMS",
          details: result.data,
        },
        { status: notFound ? 404 : result.statusCode >= 400 && result.statusCode < 600 ? result.statusCode : 502, headers }
      )
    }

    return NextResponse.json(
      {
        status: "success",
        message: "PMS invoice status patched successfully",
        data: {
          pms_response: result.data,
          patched_via_mongo_id: pmsMatch.mongoId,
          patched_via_invoice_id: pmsMatch.pmsInvoiceKey,
          resolved_from_pms_list: Boolean(patientIdForLookup),
          pms_list_count: patientIdForLookup ? pmsList.length : undefined,
        },
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      {
        status: "error",
        error_code: "SYSTEM_FAILURE",
        message: "Failed to update invoice",
        details: { error: error instanceof Error ? error.message : "Unknown error" },
      },
      { status: 500, headers }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<"/api/invoices/[invoiceId]">) {
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

    const deleted = await deleteInvoice(invoiceId)
    if (!deleted) {
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
