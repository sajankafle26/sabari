import { NextRequest, NextResponse } from "next/server";
import { SubscriptionPlan } from "@/lib/models";
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
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json({ plan });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch plan" }, { status: 500 });
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
    const plan = await SubscriptionPlan.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Plan updated", plan });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update plan" }, { status: 500 });
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
    const plan = await SubscriptionPlan.findByIdAndDelete(id);
    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Plan deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete plan" }, { status: 500 });
  }
}
