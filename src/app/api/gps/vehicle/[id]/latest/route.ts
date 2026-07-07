import { NextRequest, NextResponse } from "next/server";
import { GPSLog } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const log = await GPSLog.findOne({ vehicle: id })
      .sort({ timestamp: -1 })
      .populate("driver", "fullName phone")
      .populate("vehicle", "vehicleNumber type");

    if (!log) {
      return NextResponse.json({ message: "No location data found" }, { status: 404 });
    }

    return NextResponse.json({ location: log });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch location" }, { status: 500 });
  }
}
