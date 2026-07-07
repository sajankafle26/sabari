import { NextRequest, NextResponse } from "next/server";
import { Schedule } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const query: any = { _id: id };
    if (user.role !== "super_admin") query.company = user.company;

    const schedule = await Schedule.findOne(query)
      .populate("vehicle", "vehicleNumber type brand model")
      .populate("driver", "fullName phone")
      .populate("route", "name from to");

    if (!schedule) {
      return NextResponse.json({ message: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json({ schedule });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const query: any = { _id: id };
    if (user.role !== "super_admin") query.company = user.company;

    const body = await request.json();
    delete body.company;
    const schedule = await Schedule.findOneAndUpdate(query, body, { new: true, runValidators: true });
    if (!schedule) {
      return NextResponse.json({ message: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Schedule updated", schedule });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update schedule" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const query: any = { _id: id };
    if (user.role !== "super_admin") query.company = user.company;

    const schedule = await Schedule.findOneAndDelete(query);
    if (!schedule) {
      return NextResponse.json({ message: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Schedule deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete schedule" }, { status: 500 });
  }
}
