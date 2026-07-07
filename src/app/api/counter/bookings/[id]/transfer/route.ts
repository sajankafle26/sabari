import { NextRequest, NextResponse } from "next/server";
import { Booking, Schedule, Vehicle } from "@/lib/models";
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
    const { newSeats, newScheduleId } = await request.json();

    const query: any = { _id: id, company: user.company };
    if (user.counter) query.counter = user.counter;
    const booking = await Booking.findOne(query);

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    if (booking.bookingStatus !== "confirmed") {
      return NextResponse.json({ message: "Only confirmed bookings can be transferred" }, { status: 400 });
    }

    if (newScheduleId) {
      const newSchedule = await Schedule.findById(newScheduleId).populate("vehicle");
      if (!newSchedule) return NextResponse.json({ message: "New schedule not found" }, { status: 404 });

      const vehicle = await Vehicle.findById(newSchedule.vehicle);
      if (!vehicle) return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });

      const existingBookings = await Booking.countDocuments({
        schedule: newScheduleId,
        journeyDate: booking.journeyDate,
        bookingStatus: "confirmed",
        _id: { $ne: booking._id },
      });

      const seatsNeeded = newSeats ? newSeats.length : booking.passengers.length;
      const available = vehicle.capacity - existingBookings;
      if (seatsNeeded > available) {
        return NextResponse.json({ message: `Not enough seats. Only ${available} left.` }, { status: 400 });
      }

      booking.schedule = newScheduleId;
    }

    if (newSeats && newSeats.length > 0) {
      if (newSeats.length !== booking.passengers.length) {
        return NextResponse.json({ message: "Seat count must match passenger count" }, { status: 400 });
      }
      (booking as any).passengers = booking.passengers.map((p: any, i: number) => ({
        ...(p.toObject?.() || p),
        seatNumber: newSeats[i],
      }));
    }

    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime");

    return NextResponse.json({ message: "Seats transferred successfully", booking: updated });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Transfer failed" }, { status: 500 });
  }
}
