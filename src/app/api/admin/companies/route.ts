import { NextRequest, NextResponse } from "next/server";
import { Company } from "@/lib/models";
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
    if (searchParams.get("status")) query.status = searchParams.get("status");
    if (searchParams.get("isActive")) query.isActive = searchParams.get("isActive") === "true";

    const companies = await Company.find(query)
      .populate("subscription.plan", "name price")
      .sort({ createdAt: -1 });

    return NextResponse.json({ companies });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch companies" }, { status: 500 });
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
    const company = await Company.create(body);
    return NextResponse.json({ message: "Company created", company }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create company" }, { status: 500 });
  }
}
