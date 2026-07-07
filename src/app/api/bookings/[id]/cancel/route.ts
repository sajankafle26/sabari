import { NextRequest, NextResponse } from "next/server"
import { Booking } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"
import { cancelAndRefund } from "@/lib/services/refund"
import { sendNotification } from "@/lib/services/notification"
import { logAction } from "@/lib/services/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request)
  if (error) return error

  const { id } = await params

  try {
    await connectDB()
    const { reason, forceRefund } = await request.json()

    const booking = await Booking.findById(id)
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 })
    }

    const isOwner =
      String(booking.bookedBy) === String(user._id) ||
      String(booking.company) === String(user.company)

    if (!isOwner && user.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized to cancel this booking" }, { status: 403 })
    }

    const result = await cancelAndRefund(id, String(user._id), reason || "Cancelled by user", {
      forceRefund: forceRefund === true && user.role === "super_admin",
    })

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 })
    }

    const passenger = booking.passengers[0] as { email?: string; phone?: string } | undefined
    const passengerEmail = passenger?.email || undefined
    const passengerPhone = passenger?.phone || undefined

    await sendNotification({
      recipient: String(booking.bookedBy || user._id),
      type: "vehicle_cancelled",
      title: "Booking Cancelled",
      message: result.message,
      data: {
        bookingId: booking.bookingId,
        refundAmount: result.refundAmount,
        refundPercentage: result.refundPercentage,
      },
      channels: {
        inApp: true,
        email: !!passengerEmail,
        sms: !!passengerPhone,
      },
      emailAddress: passengerEmail,
      smsPhone: passengerPhone,
    })

    logAction({
      userId: String(user._id),
      action: "booking_cancelled",
      resource: "booking",
      resourceId: id,
      details: { reason, refundAmount: result.refundAmount, refundPercentage: result.refundPercentage },
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Cancellation failed" }, { status: 500 })
  }
}
