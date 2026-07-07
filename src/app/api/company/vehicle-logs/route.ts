import { NextRequest, NextResponse } from "next/server";
import { Vehicle, VehicleLog } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin", "counter_operator")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const { vehicle: vehicleId, type, amount, quantity, mileage, description, notes, odometerReading, nextDue, vendor } = body;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, ...(user.role !== "super_admin" ? { company: user.company } : {}) });
    if (!vehicle) return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });

    const log = await VehicleLog.create({
      vehicle: vehicleId,
      company: vehicle.company,
      type, amount, quantity, mileage, description, notes, odometerReading, nextDue, vendor,
      performedBy: user._id,
      performedAt: new Date(),
    });

    if (odometerReading) {
      vehicle.currentMileage = odometerReading;
    }
    if (type === "fuel" && quantity) {
      const prevMileage = vehicle.currentMileage || 0;
      if (prevMileage > 0 && log.odometerReading) {
        const dist = log.odometerReading - prevMileage;
        if (dist > 0) vehicle.mileagePerLiter = Math.round(dist / quantity);
      }
    }
    if (type === "service") {
      vehicle.lastServicedAt = new Date();
      vehicle.status = "active";
      if (nextDue) vehicle.nextServiceDate = nextDue;
      if (body.nextServiceMileage) vehicle.nextServiceMileage = body.nextServiceMileage;
    }
    await vehicle.save();

    return NextResponse.json({ message: "Vehicle log entry saved", log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to save log" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin", "counter_operator")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicle");
    const type = searchParams.get("type");

    const query: any = {};
    if (user.role !== "super_admin") query.company = user.company;
    if (vehicleId) query.vehicle = vehicleId;
    if (type) query.type = type;

    const logs = await VehicleLog.find(query)
      .populate("vehicle", "vehicleNumber type")
      .populate("performedBy", "firstName lastName")
      .sort({ performedAt: -1 })
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}
