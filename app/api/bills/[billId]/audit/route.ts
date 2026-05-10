import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse, getDeprecationWarningHeader } from "@/lib/auth";
import { formatServiceError, listBillAuditTrail } from "@/lib/billing/service";

interface RouteContext {
  params: Promise<{ billId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = validateApiKey(request, { routeName: "/api/bills/[billId]/audit" });
  if (!authResult.isValid) {
    return unauthorizedResponse();
  }

  const headers = authResult.requiresWarning ? getDeprecationWarningHeader() : {};

  try {
    const { billId } = await context.params;
    const audits = listBillAuditTrail(billId);
    return NextResponse.json({ data: audits }, { status: 200, headers });
  } catch (error) {
    const { status, body } = formatServiceError(error);
    return NextResponse.json(body, { status, headers });
  }
}
