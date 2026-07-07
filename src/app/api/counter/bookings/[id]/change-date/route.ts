import { NextRequest, NextResponse } from "next/server";
import { Booking } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("counter_operator", "company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const { newDate, newScheduleId } = await request.json();

    const query: any = { _id: id, company: user.company };
    if (user.counter) query.counter = user.counter;
    const booking = await Booking.findOne(query);

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.bookingStatus !== "confirmed") {
      return NextResponse.json({ message: "Only confirmed bookings can be rescheduled" }, { status: 400 });
    }

    if (newDate) booking.journeyDate = new Date(newDate);
    if (newScheduleId) booking.schedule = newScheduleId;
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime");

    return NextResponse.json({ message: "Journey date updated", booking: updated });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update journey date" }, { status: 500 });
  }
}
