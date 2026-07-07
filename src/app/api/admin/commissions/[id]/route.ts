import { NextRequest, NextResponse } from "next/server";
import { TicketCommission } from "@/lib/models";
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
    const commission = await TicketCommission.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!commission) return NextResponse.json({ message: "Commission not found" }, { status: 404 });
    return NextResponse.json({ message: "Commission updated", commission });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update commission" }, { status: 500 });
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
    const commission = await TicketCommission.findByIdAndDelete(id);
    if (!commission) return NextResponse.json({ message: "Commission not found" }, { status: 404 });
    return NextResponse.json({ message: "Commission deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete commission" }, { status: 500 });
  }
}
