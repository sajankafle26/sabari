import { NextRequest, NextResponse } from "next/server";
import { Driver } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const companyId = user.role === "super_admin" ? undefined : user.company;
    const query: any = {};
    if (companyId) query.company = companyId;

    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ drivers });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("company_admin", "super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const body = await request.json();
    body.company = user.company;
    const driver = await Driver.create(body);
    return NextResponse.json({ message: "Driver created", driver }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create driver" }, { status: 500 });
  }
}
