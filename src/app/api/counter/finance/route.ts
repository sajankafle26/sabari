import { NextRequest, NextResponse } from "next/server"
import { Booking, Payment } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate, authorize } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error
  const authError = authorize("counter_operator", "super_admin")(user)
  if (authError) return authError

  if (!user.company) {
    return NextResponse.json({ message: "Company not assigned" }, { status: 403 })
  }

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const startDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d })()
    const endDate = to ? new Date(to + "T23:59:59.999Z") : new Date()
    if (!from) startDate.setHours(0, 0, 0, 0)

    const matchStage: any = {
      company: user.company,
      journeyDate: { $gte: startDate, $lte: endDate },
      paymentStatus: "paid",
    }

    let data: any = null

    switch (type) {
      case "overview": {
        const [revenueAgg, todayAgg, paymentMethods] = await Promise.all([
          (Booking as any).aggregate([
            { $match: matchStage },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, commission: { $sum: "$commission" }, bookings: { $sum: 1 } } },
          ]).catch(() => []),
          (Booking as any).aggregate([
            { $match: { ...matchStage, journeyDate: { $gte: new Date(new Date().setHours(0,0,0,0)), $lte: new Date(new Date().setHours(23,59,59,999)) } } },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
          ]).catch(() => []),
          (Booking as any).aggregate([
            { $match: matchStage },
            { $group: { _id: "$paymentMethod", count: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
          ]).catch(() => []),
        ])

        const total = revenueAgg[0] || { revenue: 0, commission: 0, bookings: 0 }
        const today = todayAgg[0] || { revenue: 0, bookings: 0 }

        data = {
          totalRevenue: total.revenue || 0,
          totalCommission: total.commission || 0,
          totalBookings: total.bookings || 0,
          todayRevenue: today.revenue || 0,
          todayBookings: today.bookings || 0,
          netEarnings: (total.revenue || 0) - (total.commission || 0),
          paymentMethods: paymentMethods.map((p: any) => ({ method: p._id || "unknown", count: p.count, amount: p.amount })),
        }
        break
      }

      case "daily-revenue": {
        const result = await (Booking as any).aggregate([
          { $match: matchStage },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$journeyDate" } }, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]).catch(() => [])
        const map = new Map<string, any>(result.map((r: any) => [r._id, r]))
        const days: any[] = []
        const current = new Date(startDate)
        while (current <= endDate) {
          const key = current.toISOString().split("T")[0]
          const entry = map.get(key)
          days.push({ date: key, revenue: entry?.revenue || 0, bookings: entry?.bookings || 0 })
          current.setDate(current.getDate() + 1)
        }
        data = days
        break
      }

      case "payment-breakdown": {
        data = await (Booking as any).aggregate([
          { $match: matchStage },
          { $group: { _id: "$paymentMethod", revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
          { $sort: { revenue: -1 } },
        ]).catch(() => [])
        break
      }

      default:
        return NextResponse.json({ message: "Invalid report type" }, { status: 400 })
    }

    return NextResponse.json({ data, type, from: startDate, to: endDate })
  } catch (error: any) {
    console.error("Counter finance error:", error)
    return NextResponse.json({ message: error.message || "Failed to generate finance report" }, { status: 500 })
  }
}
