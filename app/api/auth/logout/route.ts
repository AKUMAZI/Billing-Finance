import { NextRequest, NextResponse } from "next/server"
import { BILLING_SESSION_COOKIE_NAME } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(_request: NextRequest) {
  const res = NextResponse.json({ success: true })
  res.cookies.set(BILLING_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}

