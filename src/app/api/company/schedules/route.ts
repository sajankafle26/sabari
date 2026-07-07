import { NextRequest, NextResponse } from "next/server";
import { Schedule } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const companyId = user.role === "super_admin" ? undefined : user.company;
    const { searchParams } = new URL(request.url);
    const query: any = {};
    if (companyId) query.company = companyId;
    if (searchParams.get("date")) query.date = new Date(searchParams.get("date")!);
    if (searchParams.get("status")) query.status = searchParams.get("status");
    if (searchParams.get("route")) query.route = searchParams.get("route");

    const schedules = await Schedule.find(query)
      .populate("vehicle", "vehicleNumber type brand model")
      .populate("driver", "fullName phone")
      .populate("route", "name from to")
      .sort({ createdAt: -1 });

    return NextResponse.json({ schedules });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    body.company = user.company;
    const schedule = await Schedule.create(body);
    return NextResponse.json({ message: "Schedule created", schedule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create schedule" }, { status: 500 });
  }
}
