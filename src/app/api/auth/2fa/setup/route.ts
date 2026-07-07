import { NextRequest, NextResponse } from "next/server"
import { User } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"
import { sendOTP } from "@/lib/services/two-factor"
import { logAction } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const fullUser = await User.findById(user._id)
    if (!fullUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (fullUser.twoFactorEnabled) {
      return NextResponse.json({ message: "2FA is already enabled" }, { status: 400 })
    }

    const result = await sendOTP(String(user._id), fullUser.phone, "setup")

    await logAction({
      userId: String(user._id),
      action: "2fa_setup_initiated",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to initiate 2FA setup" }, { status: 500 })
  }
}
