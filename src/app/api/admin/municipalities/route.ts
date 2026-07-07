import { NextRequest, NextResponse } from "next/server";
import { Municipality } from "@/lib/models";
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
    if (searchParams.get("district")) query.district = searchParams.get("district");
    if (searchParams.get("isActive")) query.isActive = searchParams.get("isActive") === "true";
    if (searchParams.get("type")) query.type = searchParams.get("type");

    const municipalities = await Municipality.find(query)
      .populate("district", "name province")
      .sort({ name: 1 });

    return NextResponse.json({ municipalities });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch municipalities" }, { status: 500 });
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
    const municipality = await Municipality.create(body);
    return NextResponse.json({ message: "Municipality created", municipality }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create municipality" }, { status: 500 });
  }
}
