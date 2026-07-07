import { NextRequest, NextResponse } from "next/server";
import { Booking } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { logAction } from "@/lib/services/audit";

const createBookingRateLimit = rateLimit({ windowMs: 60000, max: 20 });

export async function POST(request: NextRequest) {
  const rateLimitError = createBookingRateLimit(request);
  if (rateLimitError) return rateLimitError;

  const { error, user } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
    const { schedule, route, vehicle, passengers, journeyDate, totalAmount, paymentMethod } = await request.json();

    const booking = await Booking.create({
      company: user.company || "mock_company",
      schedule, route, vehicle,
      passengers, journeyDate,
      totalAmount,
      bookedBy: user._id,
      counter: user.counter,
      source: user.counter ? "counter" : "online",
      paymentMethod,
      bookingStatus: "pending",
      paymentStatus: "pending",
    });

    const populated = await Booking.findById(booking._id)
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime")
      .populate("bookedBy", "firstName lastName");

    logAction({
      userId: String(user._id),
      action: "booking_created",
      resource: "booking",
      resourceId: String(booking._id),
      details: { totalAmount, passengers: passengers?.length },
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ message: "Booking created", booking: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Booking failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();

    const query: any = {};
    if (user.role === "passenger") {
      query["passengers.email"] = user.email;
    } else if (user.company) {
      query.company = user.company;
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get("status")) query.bookingStatus = searchParams.get("status");
    if (searchParams.get("date")) query.journeyDate = new Date(searchParams.get("date")!);

    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { _id: search },
      ];
    }

    const bookings = await Booking.find(query)
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime")
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch bookings" }, { status: 500 });
  }
}
