import { NextRequest, NextResponse } from "next/server";
import { Booking, Payment } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";
import QRCode from "qrcode";
import { sendBookingConfirmation } from "@/lib/services/notification";

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("counter_operator", "company_admin", "super_admin")(user);
  if (authError) return authError;
  if (user.role === "counter_operator" && !user.counter) {
    return NextResponse.json({ message: "Counter not assigned" }, { status: 403 });
  }

  try {
    await connectDB();
    const { schedule, route, vehicle, passengers, journeyDate, totalAmount, paymentMethod } = await request.json();

    const isCash = paymentMethod === "cash";

    const booking = await Booking.create({
      company: user.company,
      schedule, route, vehicle,
      passengers, journeyDate,
      totalAmount,
      bookedBy: user._id,
      counter: user.counter,
      source: "counter",
      paymentMethod,
      bookingStatus: isCash ? "confirmed" : "pending",
      paymentStatus: "pending",
    });

    if (booking.bookingId) {
      booking.qrCode = await QRCode.toDataURL(booking.bookingId, { width: 300, margin: 1 }).catch(() => undefined);
    }
    await booking.save();

    if (isCash) {
      await Payment.create({
        booking: booking._id,
        amount: totalAmount,
        method: "cash",
        status: "initiated",
        paidBy: user._id,
      });
    }

    const populated = await Booking.findById(booking._id)
      .populate("route", "from to")
      .populate("vehicle", "vehicleNumber type")
      .populate("schedule", "departureTime arrivalTime")
      .populate("bookedBy", "firstName lastName");

    const firstPassenger = populated?.passengers?.[0];
    const pFrom = (populated as any)?.route?.from || "";
    const pTo = (populated as any)?.route?.to || "";
    const pTime = (populated as any)?.schedule?.departureTime || "";
    const pSeats = populated?.passengers?.map((p: any) => p.seatNumber).join(", ") || "";

    if (firstPassenger?.phone) {
      sendBookingConfirmation({
        name: firstPassenger.name,
        phone: firstPassenger.phone,
        bookingId: booking.bookingId || "",
        from: pFrom,
        to: pTo,
        date: booking.journeyDate?.toISOString?.().split("T")[0] || "",
        time: pTime,
        seats: pSeats,
        amount: booking.totalAmount,
        vehicle: (populated as any)?.vehicle?.vehicleNumber || "",
      }).catch(() => {});
    }

    return NextResponse.json({ message: "Booking created", booking: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Booking failed" }, { status: 500 });
  }
}

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
    const query: any = { company: user.company, counter: user.counter };

    if (searchParams.get("status")) query.bookingStatus = searchParams.get("status");
    if (searchParams.get("date")) {
      const date = new Date(searchParams.get("date")!);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      query.journeyDate = { $gte: date, $lt: next };
    }
    if (searchParams.get("phone")) {
      query["passengers.phone"] = searchParams.get("phone");
    }

    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: "i" } },
        { "passengers.name": { $regex: search, $options: "i" } },
        { "passengers.phone": { $regex: search, $options: "i" } },
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
