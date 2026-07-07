import { NextRequest, NextResponse } from "next/server"
import { Booking, Payment, Expense, Company, Counter } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate, authorize } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error
  const authError = authorize("super_admin")(user)
  if (authError) return authError

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "overview"
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined

    const startDate = from ? new Date(from) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); d.setHours(0, 0, 0, 0); return d })()
    const endDate = to ? new Date(to + "T23:59:59.999Z") : new Date()

    if (!from) startDate.setHours(0, 0, 0, 0)

    let data: any = null

    switch (type) {
      case "overview": {
        const [revenueAgg, expenseAgg, companyCount, counterCount] = await Promise.all([
          (Booking as any).aggregate([
            { $match: { journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
            { $group: { _id: null, revenue: { $sum: "$totalAmount" }, commission: { $sum: "$commission" }, bookings: { $sum: 1 } } },
          ]).catch(() => []),
          (Expense as any).aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
          ]).catch(() => []),
          Company.countDocuments().catch(() => 0),
          Counter.countDocuments().catch(() => 0),
        ])

        const rev = revenueAgg[0] || { revenue: 0, commission: 0, bookings: 0 }
        const exp = expenseAgg[0] || { totalExpenses: 0 }

        data = {
          totalRevenue: rev.revenue || 0,
          platformCommission: rev.commission || 0,
          totalExpenses: exp.totalExpenses || 0,
          netProfit: (rev.revenue || 0) - (rev.commission || 0) - (exp.totalExpenses || 0),
          totalBookings: rev.bookings || 0,
          totalCompanies: companyCount,
          totalCounters: counterCount,
        }
        break
      }

      case "company-comparison": {
        const companyMap = new Map<string, string>()
        const companies = await Company.find({}, "name").lean().catch(() => [])
        for (const c of companies) {
          companyMap.set((c as any)._id.toString(), (c as any).name)
        }
        const result = await (Booking as any).aggregate([
          { $match: { journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
          { $group: { _id: { $toString: "$company" }, revenue: { $sum: "$totalAmount" }, commission: { $sum: "$commission" }, bookings: { $sum: 1 } } },
          { $sort: { revenue: -1 } },
        ]).catch(() => [])
        data = result.map((r: any) => ({
          company: companyMap.get(r._id) || "Unknown",
          revenue: r.revenue,
          commission: r.commission,
          bookings: r.bookings,
        }))
        break
      }

      case "payment-methods": {
        data = await (Booking as any).aggregate([
          { $match: { journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid", paymentMethod: { $exists: true, $ne: null } } },
          { $group: { _id: "$paymentMethod", revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
          { $sort: { revenue: -1 } },
        ]).catch(() => [])
        break
      }

      case "daily-revenue": {
        const result = await (Booking as any).aggregate([
          { $match: { journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$journeyDate" } }, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]).catch(() => [])
        data = fillDateGaps(result, startDate, endDate)
        break
      }

      case "counter-income": {
        const counterMap = new Map<string, { name: string; code: string }>()
        const counters = await Counter.find({}, "name code").lean().catch(() => [])
        for (const c of counters) {
          counterMap.set((c as any)._id.toString(), { name: (c as any).name, code: (c as any).code })
        }
        const result = await (Booking as any).aggregate([
          { $match: { journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
          { $group: { _id: { $toString: "$counter" }, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 }, commission: { $sum: "$commission" } } },
          { $sort: { revenue: -1 } },
        ]).catch(() => [])
        data = result.map((r: any) => {
          const info = counterMap.get(r._id)
          return {
            counter: info?.name || "Online",
            code: info?.code || "",
            revenue: r.revenue,
            bookings: r.bookings,
            commission: r.commission,
          }
        })
        break
      }

      case "monthly-trend": {
        data = await (Booking as any).aggregate([
          { $match: { journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
          { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$journeyDate" } }, revenue: { $sum: "$totalAmount" }, commission: { $sum: "$commission" }, bookings: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]).catch(() => [])
        break
      }

      default:
        return NextResponse.json({ message: "Invalid report type" }, { status: 400 })
    }

    return NextResponse.json({ data, type, from: startDate, to: endDate })
  } catch (error: any) {
    console.error("Finance report error:", error)
    return NextResponse.json({ message: error.message || "Failed to generate finance report" }, { status: 500 })
  }
}

function fillDateGaps(results: Array<{ _id: string; revenue: number; bookings: number }>, start: Date, end: Date) {
  const data: Array<{ date: string; revenue: number; bookings: number }> = []
  const map = new Map(results.map((r) => [r._id, { revenue: r.revenue, bookings: r.bookings }]))
  const current = new Date(start)
  while (current <= end) {
    const key = current.toISOString().split("T")[0]
    data.push({ date: key, revenue: map.get(key)?.revenue || 0, bookings: map.get(key)?.bookings || 0 })
    current.setDate(current.getDate() + 1)
  }
  return data
}
