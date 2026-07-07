import { NextRequest, NextResponse } from "next/server";
import { Driver } from "@/lib/models";
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

    const driver = await Driver.findOne(query);
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    return NextResponse.json({ driver });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch driver" }, { status: 500 });
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
    const driver = await Driver.findOneAndUpdate(query, body, { new: true, runValidators: true });
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Driver updated", driver });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update driver" }, { status: 500 });
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

    const driver = await Driver.findOneAndDelete(query);
    if (!driver) {
      return NextResponse.json({ message: "Driver not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Driver deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete driver" }, { status: 500 });
  }
}
