import { NextRequest, NextResponse } from "next/server"
import { authenticate } from "@/lib/middleware/auth"
import { sendOTP, verifyOTP, disable2FA } from "@/lib/services/two-factor"
import { logAction } from "@/lib/services/audit"
import { User } from "@/lib/models"
import { connectDB } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    const { code } = await request.json()
    if (!code) {
      await connectDB()
      const fullUser = await User.findById(user._id)
      if (!fullUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 })
      }
      const result = await sendOTP(String(user._id), fullUser.phone, "disable")
      return NextResponse.json(result)
    }

    const verifyResult = await verifyOTP(String(user._id), code, "disable")
    if (!verifyResult.success) {
      return NextResponse.json({ message: verifyResult.message }, { status: 400 })
    }

    await disable2FA(String(user._id))

    await logAction({
      userId: String(user._id),
      action: "2fa_disabled",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({ message: "Two-factor authentication disabled." })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to disable 2FA" }, { status: 500 })
  }
}
