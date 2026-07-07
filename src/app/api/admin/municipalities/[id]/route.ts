import { NextRequest, NextResponse } from "next/server";
import { Municipality } from "@/lib/models";
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
    const municipality = await Municipality.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!municipality) return NextResponse.json({ message: "Municipality not found" }, { status: 404 });
    return NextResponse.json({ message: "Municipality updated", municipality });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update municipality" }, { status: 500 });
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
    const municipality = await Municipality.findByIdAndDelete(id);
    if (!municipality) return NextResponse.json({ message: "Municipality not found" }, { status: 404 });
    return NextResponse.json({ message: "Municipality deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete municipality" }, { status: 500 });
  }
}
