import { NextRequest, NextResponse } from "next/server";
import { Vehicle, Driver, Schedule, Booking, Counter, Trip } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";
import { getOrFetch } from "@/lib/services/cache";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const companyId = user.role === "super_admin" ? undefined : user.company;
    const match: any = {};
    if (companyId) match.company = companyId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cacheKey = `dashboard:${companyId || "all"}:${today.toISOString().split("T")[0]}`;

    const data = await getOrFetch(cacheKey, async () => {
      const [totalVehicles, activeVehicles, totalDrivers, todaySchedules, todayBookings, todayRevenueResult, activeTrips, totalCounters] = await Promise.all([
        Vehicle.countDocuments(match),
        Vehicle.countDocuments({ ...match, status: "active" }),
        Driver.countDocuments(match),
        Schedule.countDocuments({ ...match, date: { $gte: today, $lt: tomorrow } }),
        Booking.countDocuments({ ...match, journeyDate: { $gte: today, $lt: tomorrow } }),
        (Booking as any).aggregate([
          { $match: { ...match, journeyDate: { $gte: today, $lt: tomorrow }, paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Trip.countDocuments({ ...match, status: "running" }),
        Counter.countDocuments(match),
      ]);

      const todayRevenue = todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;

      return { totalVehicles, activeVehicles, totalDrivers, todaySchedules, todayBookings, todayRevenue, activeTrips, totalCounters }
    }, 120);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch dashboard data" }, { status: 500 });
  }
}
