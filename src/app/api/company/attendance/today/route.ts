import { NextRequest, NextResponse } from "next/server";
import { Attendance } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  try {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const record = await Attendance.findOne({
      user: user._id,
      date: { $gte: today, $lt: tomorrow },
    });

    return NextResponse.json({
      checkedIn: !!record?.clockIn,
      checkedOut: !!record?.clockOut,
      clockInTime: record?.clockIn || null,
      clockOutTime: record?.clockOut || null,
      workDuration: record?.workDuration || 0,
      attendance: record || null,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to check status" }, { status: 500 });
  }
}
