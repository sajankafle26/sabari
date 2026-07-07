import { NextRequest, NextResponse } from "next/server"
import { authenticate, authorize } from "@/lib/middleware/auth"
import { sendEmail, getEmailConfig } from "@/lib/services/email"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error
  const authError = authorize("super_admin")(user)
  if (authError) return authError

  try {
    const { to, subject, message } = await request.json()

    if (!to || !subject || !message) {
      return NextResponse.json({ message: "To, subject, and message are required" }, { status: 400 })
    }

    const config = await getEmailConfig()
    const html = `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; padding: 24px; border-radius: 12px; color: #e4e4e7;"><h2>Test Email</h2><p>${message}</p><p style="color:#71717a;font-size:12px;">This is a test email from Sabari.</p></div>`

    const result = await sendEmail(to, subject, html, config)

    if (result.success) {
      return NextResponse.json({ message: "Email sent successfully", result })
    }

    return NextResponse.json({ message: result.error || "Email failed" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Email test failed" }, { status: 500 })
  }
}
