import { NextRequest, NextResponse } from "next/server";
import { SubscriptionPlan } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query: any = {};
    if (searchParams.get("isActive")) query.isActive = searchParams.get("isActive") === "true";

    const plans = await SubscriptionPlan.find(query).sort({ price: 1 });
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    const plan = await SubscriptionPlan.create(body);
    return NextResponse.json({ message: "Plan created", plan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create plan" }, { status: 500 });
  }
}
