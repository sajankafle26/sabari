import { NextRequest, NextResponse } from "next/server";
import { Trip } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
    const { vehicle, driver, schedule, route, startOdometer, inspection } = await request.json();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existing = await Trip.findOne({
      vehicle,
      date: { $gte: todayStart },
      status: { $in: ["scheduled", "running"] },
    });

    if (existing) {
      return NextResponse.json({ message: "Trip already exists for this vehicle today" }, { status: 409 });
    }

    const trip = await Trip.create({
      company: user.company,
      vehicle, driver, schedule, route,
      date: new Date(),
      startTime: new Date(),
      status: "running",
      startOdometer,
      inspection,
    });

    return NextResponse.json({ message: "Trip started", trip }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to start trip" }, { status: 500 });
  }
}
