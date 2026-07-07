import { NextRequest, NextResponse } from "next/server";
import { GPSLog } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  const { error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
    const {
      driver, vehicle, trip, schedule,
      latitude, longitude, altitude, heading,
      speed, accuracy, battery, internet,
    } = await request.json();

    const gpsLog = await GPSLog.create({
      driver, vehicle, trip, schedule,
      latitude, longitude, altitude, heading,
      speed: speed || 0, accuracy, battery, internet,
      location: { type: "Point", coordinates: [longitude, latitude] },
      timestamp: new Date(),
    });

    return NextResponse.json({ message: "Location updated", gpsLog }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "GPS update failed" }, { status: 500 });
  }
}
