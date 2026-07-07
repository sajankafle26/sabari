import { NextRequest, NextResponse } from "next/server"
import { Booking } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate, authorize } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error
  const authError = authorize("super_admin", "company_admin")(user)
  if (authError) return authError

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const query: any = {
      bookingStatus: { $in: ["cancelled", "refunded"] },
    }

    if (user.role !== "super_admin") {
      query.company = user.company
    }

    if (status) {
      if (status === "refunded") query["cancellation.refundStatus"] = "processed"
      else if (status === "pending") query["cancellation.refundStatus"] = "pending"
      else if (status === "none") query["cancellation.refundStatus"] = "none"
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { "passengers.name": { $regex: search, $options: "i" } },
      ]
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("route", "from to")
        .populate("vehicle", "vehicleNumber type")
        .populate("schedule", "departureTime arrivalTime")
        .populate("cancellation.cancelledBy", "firstName lastName")
        .sort({ "cancellation.cancelledAt": -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(query),
    ])

    return NextResponse.json({
      refunds: bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch refunds" }, { status: 500 })
  }
}
