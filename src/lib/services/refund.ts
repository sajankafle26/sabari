import { Booking, Payment, Setting } from "@/lib/models"
import { connectDB } from "@/lib/db"

export interface RefundRules {
  fullRefundBeforeHours: number
  ninetyPctBeforeHours: number
  seventyFivePctBeforeHours: number
  fiftyPctBeforeHours: number
  noRefundBeforeHours: number
}

const defaultRules: RefundRules = {
  fullRefundBeforeHours: 24,
  ninetyPctBeforeHours: 2,
  seventyFivePctBeforeHours: 1,
  fiftyPctBeforeHours: 0.5,
  noRefundBeforeHours: 0,
}

export async function getRefundRules(): Promise<RefundRules> {
  await connectDB()
  const setting = await Setting.findOne({ key: "refund_rules" })
  if (setting?.value) {
    return { ...defaultRules, ...setting.value }
  }
  return defaultRules
}

export function calculateRefundPercentage(
  departureDate: Date,
  rules: RefundRules = defaultRules
): number {
  const now = new Date()
  const diffMs = departureDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours <= rules.noRefundBeforeHours) return 0
  if (diffHours <= rules.fiftyPctBeforeHours) return 50
  if (diffHours <= rules.seventyFivePctBeforeHours) return 75
  if (diffHours <= rules.ninetyPctBeforeHours) return 90
  if (diffHours <= rules.fullRefundBeforeHours) return 100
  return 100
}

export function calculateRefundAmount(
  totalAmount: number,
  departureDate: Date,
  rules?: RefundRules
): { percentage: number; amount: number } {
  const percentage = calculateRefundPercentage(departureDate, rules)
  return {
    percentage,
    amount: Math.round((totalAmount * percentage) / 100),
  }
}

export async function cancelAndRefund(
  bookingId: string,
  userId: string,
  reason: string,
  options?: { forceRefund?: boolean }
): Promise<{
  success: boolean
  refundAmount: number
  refundPercentage: number
  message: string
}> {
  await connectDB()

  const booking = await Booking.findById(bookingId)
  if (!booking) {
    return { success: false, refundAmount: 0, refundPercentage: 0, message: "Booking not found" }
  }

  if (booking.bookingStatus === "cancelled" || booking.bookingStatus === "refunded") {
    return { success: false, refundAmount: 0, refundPercentage: 0, message: "Booking is already cancelled" }
  }

  if (booking.bookingStatus !== "confirmed" && booking.bookingStatus !== "pending") {
    return { success: false, refundAmount: 0, refundPercentage: 0, message: "Booking cannot be cancelled" }
  }

  const rules = await getRefundRules()
  const departureTime = booking.journeyDate

  if (!options?.forceRefund && departureTime && departureTime.getTime() <= Date.now()) {
    return { success: false, refundAmount: 0, refundPercentage: 0, message: "Cannot cancel after departure" }
  }

  const { percentage, amount: refundAmount } = calculateRefundAmount(
    booking.totalAmount,
    departureTime || new Date(),
    rules
  )

  booking.bookingStatus = percentage > 0 ? "refunded" : "cancelled"
  booking.paymentStatus = percentage > 0 ? "refunded" : "paid"
  booking.isActive = false
  ;(booking as any).passengers = booking.passengers.map((p: any) => ({
    ...(typeof p.toObject === "function" ? p.toObject() : p),
    status: "cancelled",
  }))
  ;(booking as any).cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason,
    refundAmount,
    refundStatus: percentage > 0 ? "processed" : "none",
  }

  await booking.save()

  if (percentage > 0) {
    const payment = await Payment.findOne({ booking: bookingId, status: "success" })
    if (payment) {
      payment.status = "refunded"
      payment.refund = {
        amount: refundAmount,
        reason,
        processedAt: new Date(),
        processedBy: userId as any,
      }
      await payment.save()
    }
  }

  return {
    success: true,
    refundAmount,
    refundPercentage: percentage,
    message:
      percentage > 0
        ? `Booking cancelled. ${percentage}% (Rs. ${refundAmount.toLocaleString()}) will be refunded.`
        : "Booking cancelled. No refund applicable.",
  }
}
