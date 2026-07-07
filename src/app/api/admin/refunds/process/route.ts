import { NextRequest, NextResponse } from "next/server"
import { Booking, Payment } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate, authorize } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error
  const authError = authorize("super_admin", "company_admin")(user)
  if (authError) return authError

  try {
    await connectDB()
    const { bookingId, amount, reason } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ message: "Booking ID is required" }, { status: 400 })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    if (user.role !== "super_admin" && String(booking.company) !== String(user.company)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    if (booking.bookingStatus !== "cancelled" && booking.bookingStatus !== "refunded") {
      return NextResponse.json({ message: "Booking is not cancelled" }, { status: 400 })
    }

    const refundAmount = amount || booking.cancellation?.refundAmount || booking.totalAmount

    booking.paymentStatus = "refunded"
    booking.bookingStatus = "refunded"
    ;(booking as any).cancellation = {
      ...((booking as any).cancellation?.toObject?.() || booking.cancellation || {}),
      refundAmount,
      refundStatus: "processed",
      cancelledAt: (booking as any).cancellation?.cancelledAt || new Date(),
      cancelledBy: (booking as any).cancellation?.cancelledBy || user._id,
      reason: reason || (booking as any).cancellation?.reason || "Manual refund processed by admin",
      processedAt: new Date(),
      processedBy: user._id,
    }
    await booking.save()

    const payment = await Payment.findOne({ booking: bookingId })
    if (payment) {
      payment.status = "refunded"
      payment.refund = {
        amount: refundAmount,
        reason: reason || "Manual refund",
        processedAt: new Date(),
        processedBy: user._id,
      }
      await payment.save()
    }

    return NextResponse.json({
      message: `Refund of Rs. ${refundAmount.toLocaleString()} processed successfully`,
      booking,
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to process refund" }, { status: 500 })
  }
}
