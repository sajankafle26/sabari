import { NextResponse } from "next/server";
import { Company, User, Vehicle, Driver, Trip, Booking, Payment } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: Request) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalCompanies,
      totalUsers,
      totalVehicles,
      totalDrivers,
      activeTrips,
      todayPayments,
      todayBookings,
    ] = await Promise.all([
      Company.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      Vehicle.countDocuments({ isActive: true }),
      Driver.countDocuments({ isActive: true }),
      Trip.countDocuments({ status: { $in: ["scheduled", "running"] } }),
      Payment.aggregate([
        { $match: { status: "success", paidAt: { $gte: today, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Booking.countDocuments({
        bookingStatus: { $ne: "cancelled" },
        journeyDate: { $gte: today, $lte: todayEnd },
      }),
    ]);

    return NextResponse.json({
      totalCompanies,
      totalUsers,
      totalVehicles,
      totalDrivers,
      activeTrips,
      todaysRevenue: todayPayments.length > 0 ? todayPayments[0].total : 0,
      todaysBookings: todayBookings,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch dashboard data" }, { status: 500 });
  }
}
