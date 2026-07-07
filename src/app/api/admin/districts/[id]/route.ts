import { NextRequest, NextResponse } from "next/server";
import { District } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

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
    const district = await District.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!district) return NextResponse.json({ message: "District not found" }, { status: 404 });
    return NextResponse.json({ message: "District updated", district });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update district" }, { status: 500 });
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
    const district = await District.findByIdAndDelete(id);
    if (!district) return NextResponse.json({ message: "District not found" }, { status: 404 });
    return NextResponse.json({ message: "District deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete district" }, { status: 500 });
  }
}
