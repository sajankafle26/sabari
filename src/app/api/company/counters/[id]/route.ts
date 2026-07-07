import { NextRequest, NextResponse } from "next/server";
import { Counter } from "@/lib/models";
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

    const counter = await Counter.findOne(query);
    if (!counter) {
      return NextResponse.json({ message: "Counter not found" }, { status: 404 });
    }
    return NextResponse.json({ counter });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch counter" }, { status: 500 });
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
    const counter = await Counter.findOneAndUpdate(query, body, { new: true, runValidators: true });
    if (!counter) {
      return NextResponse.json({ message: "Counter not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Counter updated", counter });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update counter" }, { status: 500 });
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

    const counter = await Counter.findOneAndDelete(query);
    if (!counter) {
      return NextResponse.json({ message: "Counter not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Counter deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete counter" }, { status: 500 });
  }
}
