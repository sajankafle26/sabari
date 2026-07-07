import { NextRequest, NextResponse } from "next/server";
import { Booking } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

async function getBooking(id: string, user: any) {
  const query: any = { _id: id, company: user.company };
  if (user.counter) query.counter = user.counter;
  return Booking.findOne(query)
    .populate("route", "from to")
    .populate("vehicle", "vehicleNumber type")
    .populate("schedule", "departureTime arrivalTime fare")
    .populate("company", "name")
    .populate("bookedBy", "firstName lastName email phone")
    .populate("counter", "name code");
}

export async function GET(
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
    const booking = await getBooking(id, user);
    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch booking" }, { status: 500 });
  }
}

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
    const body = await request.json();
    const update: any = {};
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.passengers !== undefined) update.passengers = body.passengers;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, company: user.company, ...(user.counter ? { counter: user.counter } : {}) },
      { $set: update },
      { new: true }
    ).populate("route", "from to").populate("vehicle", "vehicleNumber type").populate("schedule", "departureTime arrivalTime");

    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    return NextResponse.json({ message: "Booking updated", booking });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
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
    const body = await request.json().catch(() => ({}));

    const booking = await Booking.findOne({ _id: id, company: user.company, ...(user.counter ? { counter: user.counter } : {}) });
    if (!booking) return NextResponse.json({ message: "Booking not found" }, { status: 404 });

    booking.bookingStatus = "cancelled";
    (booking as any).passengers = booking.passengers.map((p: any) => ({ ...(p.toObject?.() || p), status: "cancelled" }));
    (booking as any).cancellation = { cancelledAt: new Date(), cancelledBy: user._id, reason: body.reason || "Cancelled by counter operator" };
    booking.isActive = false;
    await booking.save();

    return NextResponse.json({ message: "Booking cancelled", booking });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to cancel booking" }, { status: 500 });
  }
}
