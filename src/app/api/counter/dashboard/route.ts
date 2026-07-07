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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const match = {
      company: user.company,
      counter: user.counter,
      journeyDate: { $gte: today, $lt: tomorrow },
    };

    const [todayBookings, todayCash, todayOnline, recentBookings] = await Promise.all([
      Booking.countDocuments(match),
      Booking.aggregate([
        { $match: { ...match, paymentMethod: "cash" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Booking.aggregate([
        { $match: { ...match, paymentMethod: { $ne: "cash" } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Booking.find(match)
        .populate("route", "from to")
        .populate("vehicle", "vehicleNumber type")
        .populate("schedule", "departureTime arrivalTime")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return NextResponse.json({
      todayBookings,
      todayCash: todayCash.length > 0 ? todayCash[0].total : 0,
      todayOnline: todayOnline.length > 0 ? todayOnline[0].total : 0,
      recentBookings,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch dashboard data" }, { status: 500 });
  }
}
