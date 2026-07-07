import { NextRequest, NextResponse } from "next/server";
import { Vehicle, VehicleLog } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin", "counter_operator")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const companyId = user.role === "super_admin" ? undefined : user.company;
    const query: any = {};
    if (companyId) query.company = companyId;

    const vehicles = await Vehicle.find(query, {
      vehicleNumber: 1, type: 1, status: 1, fuelLevel: 1, currentMileage: 1,
      nextServiceMileage: 1, nextServiceDate: 1, lastServicedAt: 1,
      insurance: 1, taxExpiry: 1, permitExpiry: 1, fuelType: 1, mileagePerLiter: 1,
    }).lean();

    const now = new Date();
    const stats = {
      total: vehicles.length,
      active: vehicles.filter((v: any) => v.status === "active").length,
      maintenance: vehicles.filter((v: any) => v.status === "maintenance").length,
      lowFuel: vehicles.filter((v: any) => (v.fuelLevel ?? 100) < 25).length,
      serviceDue: vehicles.filter((v: any) => {
        if (v.nextServiceDate && new Date(v.nextServiceDate) <= now) return true;
        if (v.nextServiceMileage && v.currentMileage && v.nextServiceMileage <= v.currentMileage) return true;
        return false;
      }).length,
      insuranceExpiring: vehicles.filter((v: any) => {
        if (!v.insurance?.expiryDate) return false;
        const daysLeft = (new Date(v.insurance.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft <= 30 && daysLeft >= 0;
      }).length,
      taxExpiring: vehicles.filter((v: any) => {
        if (!v.taxExpiry) return false;
        const daysLeft = (new Date(v.taxExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft <= 30 && daysLeft >= 0;
      }).length,
      permitExpiring: vehicles.filter((v: any) => {
        if (!v.permitExpiry) return false;
        const daysLeft = (new Date(v.permitExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysLeft <= 30 && daysLeft >= 0;
      }).length,
    };

    const lastLogs = await VehicleLog.aggregate([
      { $match: companyId ? { company: companyId } : {} },
      { $sort: { performedAt: -1 } },
      { $group: { _id: "$vehicle", lastLog: { $first: "$$ROOT" } } },
      { $limit: 50 },
    ]);

    const vehiclesWithHealth = vehicles.map((v: any) => {
      const log = lastLogs.find((l: any) => l._id.toString() === v._id.toString());
      return { ...v, lastLog: log?.lastLog || null };
    });

    return NextResponse.json({ stats, vehicles: vehiclesWithHealth });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch vehicle health" }, { status: 500 });
  }
}
