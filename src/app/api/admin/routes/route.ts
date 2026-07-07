import { NextRequest, NextResponse } from "next/server";
import { Route } from "@/lib/models";
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
    if (searchParams.get("from")) query.from = { $regex: searchParams.get("from"), $options: "i" };
    if (searchParams.get("to")) query.to = { $regex: searchParams.get("to"), $options: "i" };

    const routes = await Route.find(query).sort({ name: 1 });
    return NextResponse.json({ routes });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch routes" }, { status: 500 });
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
    const route = await Route.create(body);
    return NextResponse.json({ message: "Route created", route }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create route" }, { status: 500 });
  }
}
