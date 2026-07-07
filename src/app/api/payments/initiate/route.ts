import { NextRequest, NextResponse } from "next/server"
import { Payment, Booking } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"
import { paymentGateways } from "@/lib/services/payment"
import { rateLimit } from "@/lib/middleware/rate-limit"
import { logAction } from "@/lib/services/audit"

const paymentRateLimit = rateLimit({ windowMs: 60000, max: 10 })

export async function POST(request: NextRequest) {
  const rateLimitError = paymentRateLimit(request)
  if (rateLimitError) return rateLimitError

  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const { bookingId, gateway, amount, metadata } = await request.json()

    if (!bookingId || !gateway || !amount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    const result = await paymentGateways.initiate(gateway, bookingId, amount, metadata)

    if (!result.success) {
      return NextResponse.json({ message: result.error || "Payment initiation failed" }, { status: 400 })
    }

    await Payment.create({
      booking: bookingId,
      transactionId: result.transactionId,
      amount,
      method: gateway,
      status: "initiated",
      paidBy: user._id,
    })

    logAction({
      userId: String(user._id),
      action: "payment_initiated",
      resource: "payment",
      resourceId: result.transactionId,
      details: { bookingId, gateway, amount },
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({
      transactionId: result.transactionId,
      gateway: result.gateway,
      redirectUrl: result.redirectUrl,
      formAction: result.formAction,
      formFields: result.formFields,
      token: result.token,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Payment initiation failed" }, { status: 500 })
  }
}
