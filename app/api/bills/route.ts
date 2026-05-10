import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse, getDeprecationWarningHeader } from "@/lib/auth";
import { createBill, formatServiceError, listBills } from "@/lib/billing/service";
import { CreateBillInput } from "@/lib/billing/types";

export async function GET(request: NextRequest) {
  const authResult = validateApiKey(request, { routeName: "/api/bills", requireApiKey: false });
  if (!authResult.isValid) {
    return unauthorizedResponse();
  }

  const headers = authResult.requiresWarning ? getDeprecationWarningHeader() : {};
  return NextResponse.json({ data: listBills() }, { status: 200, headers });
}

export async function POST(request: NextRequest) {
  const authResult = validateApiKey(request, { routeName: "/api/bills", requireApiKey: false });
  if (!authResult.isValid) {
    return unauthorizedResponse();
  }

  const headers = authResult.requiresWarning ? getDeprecationWarningHeader() : {};

  try {
    const payload = (await request.json()) as CreateBillInput;
    const bill = await createBill(payload, {
      actor_id: request.headers.get("x-actor-id") ?? "system",
      actor_role: request.headers.get("x-actor-role") ?? "billing_staff",
    });
    return NextResponse.json({ data: bill }, { status: 201, headers });
  } catch (error) {
    const { status, body } = formatServiceError(error);
    return NextResponse.json(body, { status, headers });
  }
}
