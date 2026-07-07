import { NextRequest, NextResponse } from "next/server";
import { District } from "@/lib/models";
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
    if (searchParams.get("province")) query.province = searchParams.get("province");

    const districts = await District.find(query).sort({ name: 1 });
    return NextResponse.json({ districts });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch districts" }, { status: 500 });
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
    const district = await District.create(body);
    return NextResponse.json({ message: "District created", district }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create district" }, { status: 500 });
  }
}
