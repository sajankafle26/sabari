import { NextRequest, NextResponse } from "next/server";
import { Company } from "@/lib/models";
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
    const company = await Company.findById(id).populate("subscription.plan", "name price");
    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ company });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch company" }, { status: 500 });
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
    const company = await Company.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Company updated", company });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update company" }, { status: 500 });
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
    const company = await Company.findByIdAndDelete(id);
    if (!company) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Company deleted" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete company" }, { status: 500 });
  }
}
