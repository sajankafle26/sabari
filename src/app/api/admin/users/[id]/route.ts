import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models";
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
    const foundUser = await User.findById(id)
      .populate("company", "name")
      .populate("counter", "name");
    if (!foundUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ user: foundUser });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch user" }, { status: 500 });
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

    const allowedFields = ["role", "isActive", "firstName", "lastName", "email", "phone", "company", "counter"];
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("company", "name")
      .populate("counter", "name");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User updated", user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update user" }, { status: 500 });
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
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete user" }, { status: 500 });
  }
}
