import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

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
    const query: any = { _id: id, role: "counter_operator" };
    if (user.role !== "super_admin") query.company = user.company;

    const body = await request.json();
    const allowedFields: any = {};
    if (body.name) allowedFields.name = body.name;
    if (body.email) allowedFields.email = body.email;
    if (body.phone) allowedFields.phone = body.phone;
    if (typeof body.isActive === "boolean") allowedFields.isActive = body.isActive;

    const staff = await User.findOneAndUpdate(query, allowedFields, { new: true, runValidators: true });
    if (!staff) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Staff member updated", staff });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update staff member" }, { status: 500 });
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
    const query: any = { _id: id, role: "counter_operator" };
    if (user.role !== "super_admin") query.company = user.company;

    const staff = await User.findOneAndUpdate(query, { isActive: false }, { new: true });
    if (!staff) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Staff member deactivated", staff });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to deactivate staff member" }, { status: 500 });
  }
}
