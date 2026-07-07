import { NextRequest, NextResponse } from "next/server"
import { Payment, Booking } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"
import { paymentGateways } from "@/lib/services/payment"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const { gateway, transactionId, gatewayParams } = await request.json()

    if (!gateway || !transactionId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const payment = await Payment.findOne({ transactionId })
    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 })
    }

    if (payment.status === "success") {
      return NextResponse.json({ message: "Payment already verified", payment })
    }

    const result = await paymentGateways.verify(gateway, {
      transactionId,
      ...gatewayParams,
    })

    if (result.success) {
      payment.status = "success"
      payment.gatewayResponse = result
      payment.gatewayRef = result.gatewayRef
      payment.paidAt = new Date()
      payment.paidBy = user._id
      await payment.save()

      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: "paid",
        bookingStatus: "confirmed",
      })

      return NextResponse.json({ message: "Payment verified", payment, booking: payment.booking })
    }

    payment.status = "failed"
    payment.gatewayResponse = result
    await payment.save()

    return NextResponse.json({ message: result.error || "Payment verification failed" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Payment verification failed" }, { status: 500 })
  }
}
