import { NextRequest, NextResponse } from "next/server";
import { Booking } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("counter_operator", "company_admin", "super_admin")(user);
  if (authError) return authError;
  if (user.role === "counter_operator" && !user.counter) {
    return NextResponse.json({ message: "Counter not assigned" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q) {
      return NextResponse.json({ bookings: [] });
    }

    const regex = new RegExp(q, "i");
    const bookings = await Booking.find({
      company: user.company,
      $or: [
        { bookingId: { $regex: regex } },
        { "passengers.name": { $regex: regex } },
        { "passengers.phone": { $regex: regex } },
        { "passengers.email": { $regex: regex } },
      ],
    })
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime")
      .limit(20)
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Search failed" }, { status: 500 });
  }
}
