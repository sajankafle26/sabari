import { NextRequest, NextResponse } from "next/server"
import { authenticate, authorize } from "@/lib/middleware/auth"
import { sendSMS, getSMSConfig } from "@/lib/services/sms"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error
  const authError = authorize("super_admin")(user)
  if (authError) return authError

  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ message: "Phone number and message are required" }, { status: 400 })
    }

    const config = await getSMSConfig()
    const result = await sendSMS(to, message, config)

    if (result.success) {
      return NextResponse.json({ message: "SMS sent successfully", result })
    }

    return NextResponse.json({ message: result.error || "SMS failed" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "SMS test failed" }, { status: 500 })
  }
}
