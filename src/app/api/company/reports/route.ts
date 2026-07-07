import { NextRequest, NextResponse } from "next/server"
import { Booking, Trip, Expense, Vehicle, Driver, VehicleLog, GPSLog, Counter } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"
import { getOrFetch } from "@/lib/services/cache"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "daily-revenue"
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const companyId = user.company

    if (!companyId && user.role !== "super_admin") {
      return NextResponse.json({ message: "Company not assigned" }, { status: 400 })
    }

    const matchCompany: any = { company: companyId }

    let startDate: Date
    let endDate: Date

    if (from) {
      startDate = new Date(from)
    } else {
      startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
    }
    startDate.setHours(0, 0, 0, 0)

    if (to) {
      endDate = new Date(to)
    } else {
      endDate = new Date()
    }
    endDate.setHours(23, 59, 59, 999)

    const noCacheTypes = ["driver-income", "seat-occupancy", "profit-loss", "counter-income", "gps-trail", "fuel"];
    if (noCacheTypes.includes(type)) {
      return computeReport(type, matchCompany, startDate, endDate, searchParams)
    }

    const cacheKey = `report:${companyId || "all"}:${type}:${from || "default"}:${to || "default"}:${startDate.toISOString().split("T")[0]}:${endDate.toISOString().split("T")[0]}`

    const result = await getOrFetch(cacheKey, () => computeReport(type, matchCompany, startDate, endDate, searchParams), 300)

    return result
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to generate report" }, { status: 500 })
  }
}

async function computeReport(type: string, matchCompany: any, startDate: Date, endDate: Date, searchParams?: URLSearchParams) {
  let data: any

  switch (type) {
    case "daily-revenue": {
      const pipeline = [
        { $match: { ...matchCompany, journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$journeyDate" } }, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]
      const result = await (Booking as any).aggregate(pipeline)
      data = fillDateGaps(result, startDate, endDate)
      break
    }

    case "monthly-revenue": {
      const pipeline = [
        { $match: { ...matchCompany, journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
        { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$journeyDate" } }, revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]
      data = await (Booking as any).aggregate(pipeline)
      break
    }

    case "vehicle-income": {
      const pipeline = [
        { $match: { ...matchCompany, journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
        { $group: { _id: "$vehicle", revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 }, passengers: { $sum: { $size: "$passengers" } } } },
        { $sort: { revenue: -1 } },
      ]
      const result = await (Booking as any).aggregate(pipeline)
      await (Vehicle as any).populate(result, { path: "_id", select: "vehicleNumber type" })
      data = result.map((r: any) => ({
        vehicle: r._id?.vehicleNumber || "Unknown",
        type: r._id?.type || "",
        revenue: r.revenue,
        bookings: r.bookings,
        passengers: r.passengers,
      }))
      break
    }

    case "driver-income": {
      const pipeline = [
        { $match: { ...matchCompany, date: { $gte: startDate, $lte: endDate }, status: "completed" } },
        { $group: { _id: "$driver", trips: { $sum: 1 }, totalDistance: { $sum: "$distance" }, totalPassengers: { $sum: "$passengerCount" } } },
        { $sort: { trips: -1 } },
      ]
      const result = await (Trip as any).aggregate(pipeline)
      await (Driver as any).populate(result, { path: "_id", select: "firstName lastName phone" })
      data = result.map((r: any) => ({
        driver: r._id ? `${r._id.firstName || ""} ${r._id.lastName || ""}`.trim() || "Unknown" : "Unknown",
        phone: r._id?.phone || "",
        trips: r.trips,
        totalDistance: r.totalDistance || 0,
        totalPassengers: r.totalPassengers || 0,
      }))
      break
    }

    case "seat-occupancy": {
      const schedules = await (Booking as any).aggregate([
        { $match: { ...matchCompany, journeyDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$schedule", totalSeats: { $sum: { $size: "$passengers" } }, bookings: { $sum: 1 } } },
        { $sort: { totalSeats: -1 } },
        { $limit: 20 },
      ])
      await (Booking as any).populate(schedules, { path: "_id", select: "departureTime arrivalTime fare", populate: { path: "vehicle", select: "vehicleNumber capacity" } })
      data = schedules.map((s: any) => ({
        schedule: s._id?.departureTime || "N/A",
        vehicle: s._id?.vehicle?.vehicleNumber || "N/A",
        capacity: s._id?.vehicle?.capacity || 1,
        bookedSeats: s.totalSeats,
        occupancyRate: Math.round((s.totalSeats / (s._id?.vehicle?.capacity || 1)) * 100),
        bookings: s.bookings,
      }))
      break
    }

    case "profit-loss": {
      const bookingAgg = await (Booking as any).aggregate([
        { $match: { ...matchCompany, journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, commission: { $sum: "$commission" }, discount: { $sum: "$discount" } } },
      ])

      const expenseAgg = await (Expense as any).aggregate([
        { $match: { ...matchCompany, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, totalExpenses: { $sum: "$amount" } } },
      ])

      const bookingData = bookingAgg[0] || { revenue: 0, commission: 0, discount: 0 }
      const expenseData = expenseAgg[0] || { totalExpenses: 0 }

      data = {
        revenue: bookingData.revenue,
        commission: bookingData.commission,
        discount: bookingData.discount,
        netRevenue: bookingData.revenue - bookingData.commission - bookingData.discount,
        expenses: expenseData.totalExpenses,
        profit: bookingData.revenue - bookingData.commission - bookingData.discount - expenseData.totalExpenses,
      }
      break
    }

    case "counter-income": {
      const pipeline = [
        { $match: { ...matchCompany, journeyDate: { $gte: startDate, $lte: endDate }, paymentStatus: "paid" } },
        { $group: { _id: "$counter", revenue: { $sum: "$totalAmount" }, bookings: { $sum: 1 }, commission: { $sum: "$commission" } } },
        { $sort: { revenue: -1 } },
      ]
      const result = await (Booking as any).aggregate(pipeline)
      await (Counter as any).populate(result, { path: "_id", select: "name code" })
      data = result.map((r: any) => ({
        counter: r._id?.name || "Online",
        code: r._id?.code || "",
        revenue: r.revenue,
        bookings: r.bookings,
        commission: r.commission,
      }))
      break
    }

    case "gps-trail": {
      const vehicleId = searchParams?.get("vehicleId")
      if (!vehicleId) {
        return NextResponse.json({ message: "vehicleId query param required" }, { status: 400 })
      }
      const gpsLogs = await GPSLog.find({
        vehicle: vehicleId,
        timestamp: { $gte: startDate, $lte: endDate },
      }).sort({ timestamp: 1 }).limit(5000).lean()
      data = gpsLogs.map((l: any) => ({
        lat: l.location?.coordinates?.[1],
        lng: l.location?.coordinates?.[0],
        speed: l.speed,
        heading: l.heading,
        timestamp: l.timestamp,
      }))
      break
    }

    case "fuel": {
      const pipeline = [
        { $match: { ...matchCompany, type: "fuel", performedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$vehicle", totalLiters: { $sum: "$quantity" }, totalCost: { $sum: "$amount" }, entries: { $sum: 1 }, avgOdometer: { $avg: "$odometerReading" } } },
        { $sort: { totalCost: -1 } },
      ]
      const result = await (VehicleLog as any).aggregate(pipeline)
      await (Vehicle as any).populate(result, { path: "_id", select: "vehicleNumber type fuelType" })
      data = result.map((r: any) => ({
        vehicle: r._id?.vehicleNumber || "Unknown",
        type: r._id?.type || "",
        fuelType: r._id?.fuelType || "diesel",
        totalLiters: r.totalLiters,
        totalCost: r.totalCost,
        entries: r.entries,
      }))
      break
    }

    default:
      return NextResponse.json({ message: "Invalid report type" }, { status: 400 })
  }

  return NextResponse.json({ data, type, from: startDate, to: endDate })
}

function fillDateGaps(results: Array<{ _id: string; revenue: number; bookings: number }>, start: Date, end: Date) {
  const data: Array<{ date: string; revenue: number; bookings: number }> = []
  const map = new Map(results.map((r) => [r._id, { revenue: r.revenue, bookings: r.bookings }]))

  const current = new Date(start)
  while (current <= end) {
    const key = current.toISOString().split("T")[0]
    data.push({
      date: key,
      revenue: map.get(key)?.revenue || 0,
      bookings: map.get(key)?.bookings || 0,
    })
    current.setDate(current.getDate() + 1)
  }

  return data
}
