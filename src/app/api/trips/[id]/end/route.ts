import { NextRequest, NextResponse } from "next/server";
import { Trip } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const { endOdometer, distance, fuelEnd, passengerCount, endLocation } = await request.json();

    const trip = await Trip.findByIdAndUpdate(
      id,
      {
        status: "completed",
        endTime: new Date(),
        endOdometer, distance, fuelEnd, passengerCount, endLocation,
      },
      { new: true }
    );

    if (!trip) {
      return NextResponse.json({ message: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Trip completed", trip });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to end trip" }, { status: 500 });
  }
}
