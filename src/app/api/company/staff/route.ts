import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models";
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
    const query: any = { role: "counter_operator" };
    if (companyId) query.company = companyId;

    const staff = await User.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ staff });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch staff" }, { status: 500 });
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
    body.role = "counter_operator";
    const staff = await User.create(body);
    return NextResponse.json({ message: "Staff member created", staff }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create staff member" }, { status: 500 });
  }
}
