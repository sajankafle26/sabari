import { NextRequest, NextResponse } from "next/server"
import { authenticate } from "@/lib/middleware/auth"
import { verifyOTP, enable2FA } from "@/lib/services/two-factor"
import { logAction } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    const { code } = await request.json()
    if (!code || code.length !== 6) {
      return NextResponse.json({ message: "Valid 6-digit code required" }, { status: 400 })
    }

    const verifyResult = await verifyOTP(String(user._id), code, "setup")
    if (!verifyResult.success) {
      return NextResponse.json({ message: verifyResult.message }, { status: 400 })
    }

    await enable2FA(String(user._id))

    await logAction({
      userId: String(user._id),
      action: "2fa_enabled",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({ message: "Two-factor authentication enabled successfully." })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to verify setup" }, { status: 500 })
  }
}
