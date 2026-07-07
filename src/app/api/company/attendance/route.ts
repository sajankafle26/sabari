import { NextRequest, NextResponse } from "next/server";
import { Attendance } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin", "counter_operator", "driver")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { type, note, latitude, longitude } = await request.json();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (type === "clockin") {
      const existing = await Attendance.findOne({ user: user._id, date: { $gte: today, $lt: tomorrow } });
      if (existing && existing.clockIn) {
        return NextResponse.json({ message: "Already clocked in today", attendance: existing }, { status: 200 });
      }

      const attendance = await Attendance.create({
        user: user._id,
        company: user.company,
        role: user.role,
        date: new Date(),
        clockIn: new Date(),
        status: "present",
        note,
        location: latitude && longitude ? { type: "Point", coordinates: [longitude, latitude] } : undefined,
      });

      return NextResponse.json({ message: "Clocked in", attendance }, { status: 201 });
    }

    if (type === "clockout") {
      const attendance = await Attendance.findOne({ user: user._id, date: { $gte: today, $lt: tomorrow }, clockOut: { $exists: false } });
      if (!attendance) {
        return NextResponse.json({ message: "No active clock-in found for today" }, { status: 400 });
      }

      attendance.clockOut = new Date();
      attendance.workDuration = Math.floor((attendance.clockOut.getTime() - attendance.clockIn.getTime()) / 1000);
      await attendance.save();

      return NextResponse.json({ message: "Clocked out", attendance });
    }

    return NextResponse.json({ message: "Invalid type. Use 'clockin' or 'clockout'" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Attendance failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin", "counter_operator", "driver")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query: any = {};

    const isAdmin = user.role === "company_admin" || user.role === "super_admin";
    if (!isAdmin) {
      query.user = user._id;
    } else {
      if (user.role !== "super_admin") query.company = user.company;
      const userId = searchParams.get("userId");
      if (userId) query.user = userId;
    }

    const date = searchParams.get("date");
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      query.date = { $gte: d, $lt: next };
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Attendance.find(query)
        .populate("user", "firstName lastName email phone role")
        .sort({ date: -1, clockIn: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(query),
    ]);

    return NextResponse.json({
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch attendance" }, { status: 500 });
  }
}
