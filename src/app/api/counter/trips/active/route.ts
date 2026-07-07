import { NextResponse } from "next/server"
import { Booking, Trip, GPSLog } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function GET(request: Request) {
  const { error, user } = await authenticate(request)
  if (error) return error

  if (user.role !== "counter_operator" && user.role !== "company_admin" && user.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  try {
    await connectDB()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const bookingFilter: Record<string, any> = {
      journeyDate: { $gte: today, $lt: tomorrow },
      bookingStatus: { $in: ["confirmed", "completed"] },
    }

    if (user.role === "counter_operator" && user.counter) {
      bookingFilter.counter = user.counter
    } else if (user.company) {
      bookingFilter.company = user.company
    }

    const bookings = await Booking.find(bookingFilter)
      .select("vehicle route schedule")
      .lean()

    const vehicleIds = [...new Set(bookings.map((b: any) => b.vehicle?.toString()).filter(Boolean))]

    if (vehicleIds.length === 0) {
      return NextResponse.json([])
    }

    const activeTrips = await Trip.find({
      vehicle: { $in: vehicleIds },
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ["running", "scheduled"] },
    })
      .populate("vehicle", "vehicleNumber type")
      .populate("driver", "firstName lastName phone")
      .populate("route", "from to")
      .populate("schedule", "departureTime arrivalTime")
      .lean()

    const tripsWithGps = await Promise.all(
      activeTrips.map(async (trip: any) => {
        const latestGps = await GPSLog.findOne({ trip: trip._id })
          .sort({ timestamp: -1 })
          .lean()

        return {
          id: String(trip._id),
          tripId: String(trip._id),
          vehicleId: trip.vehicle?._id ? String(trip.vehicle._id) : null,
          vehicleNumber: trip.vehicle?.vehicleNumber || "Unknown",
          vehicleName: trip.vehicle?.type || "",
          driver: trip.driver ? `${trip.driver.firstName || ""} ${trip.driver.lastName || ""}`.trim() || "Unknown Driver" : "Unknown Driver",
          route: trip.route ? `${trip.route.from} → ${trip.route.to}` : "Unknown Route",
          speed: latestGps?.speed ?? 0,
          eta: trip.schedule?.arrivalTime || "-",
          status: trip.status === "running" ? "moving" : trip.status,
          location: latestGps ? `${latestGps.latitude?.toFixed(4)}, ${latestGps.longitude?.toFixed(4)}` : "",
          lat: latestGps?.latitude ?? 0,
          lng: latestGps?.longitude ?? 0,
          lastUpdated: latestGps?.timestamp?.toISOString() || trip.updatedAt?.toISOString() || new Date().toISOString(),
        }
      })
    )

    return NextResponse.json(tripsWithGps)
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch active trips" }, { status: 500 })
  }
}
