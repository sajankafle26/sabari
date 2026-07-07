import { NextRequest, NextResponse } from "next/server";
import { Booking } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("counter_operator", "company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { phone } = await params;

    const query: any = { company: user.company, "passengers.phone": phone };
    if (user.counter) query.counter = user.counter;

    const bookings = await Booking.find(query)
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime")
      .sort({ createdAt: -1 });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch history" }, { status: 500 });
  }
}
