import { NextRequest, NextResponse } from "next/server";
import { Vehicle } from "@/lib/models";
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

    const vehicle = await Vehicle.findOne(query).populate("company", "name");
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json({ vehicle });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch vehicle" }, { status: 500 });
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
    const vehicle = await Vehicle.findOneAndUpdate(query, body, { new: true, runValidators: true });
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Vehicle updated", vehicle });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update vehicle" }, { status: 500 });
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

    const vehicle = await Vehicle.findOneAndDelete(query);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Vehicle deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete vehicle" }, { status: 500 });
  }
}
