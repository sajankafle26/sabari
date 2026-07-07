import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { User } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { verifyOTP, sendOTP } from "@/lib/services/two-factor"
import { logAction } from "@/lib/services/audit"
import { rateLimit } from "@/lib/middleware/rate-limit"

const JWT_SECRET = process.env.JWT_SECRET || "sabari-jwt-secret-key-2026"

const verifyRateLimit = rateLimit({ windowMs: 60000, max: 10 })

export async function POST(request: NextRequest) {
  const rateLimitError = verifyRateLimit(request)
  if (rateLimitError) return rateLimitError

  try {
    await connectDB()
    const { pendingToken, code } = await request.json()

    if (!pendingToken || !code) {
      return NextResponse.json({ message: "Pending token and code required" }, { status: 400 })
    }

    let decoded: { id: string; purpose: string }
    try {
      decoded = jwt.verify(pendingToken, JWT_SECRET) as any
      if (decoded.purpose !== "2fa_login") {
        return NextResponse.json({ message: "Invalid token purpose" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ message: "Invalid or expired token. Please login again." }, { status: 401 })
    }

    const user = await User.findById(decoded.id)
    if (!user || !user.isActive) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (code === "resend") {
      const result = await sendOTP(String(user._id), user.phone, "login")
      return NextResponse.json(result)
    }

    const verifyResult = await verifyOTP(String(user._id), code, "login")
    if (!verifyResult.success) {
      return NextResponse.json({ message: verifyResult.message }, { status: 400 })
    }

    user.lastLogin = new Date()
    user.loginHistory.push({
      ip: request.headers.get("x-forwarded-for") || "unknown",
      device: request.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
    })
    if (user.loginHistory.length > 50) {
      user.loginHistory = (user.loginHistory as any).slice(-50)
    }
    await user.save()

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    await logAction({
      userId: String(user._id),
      action: "login_2fa_verified",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({ message: "Login successful", token, user })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Verification failed" }, { status: 500 })
  }
}
