import { NextRequest, NextResponse } from "next/server";
import { Route } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const route = await Route.findById(id);
    if (!route) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }
    return NextResponse.json({ route });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch route" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const route = await Route.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!route) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Route updated", route });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update route" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { id } = await params;
    const route = await Route.findByIdAndDelete(id);
    if (!route) {
      return NextResponse.json({ message: "Route not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Route deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete route" }, { status: 500 });
  }
}
