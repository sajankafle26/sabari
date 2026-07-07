import { NextRequest, NextResponse } from "next/server";
import { TicketCommission } from "@/lib/models";
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
    if (searchParams.get("type")) query.type = searchParams.get("type");
    if (searchParams.get("appliesTo")) query.appliesTo = searchParams.get("appliesTo");

    const commissions = await TicketCommission.find(query)
      .populate("company", "name")
      .populate("route", "name from to")
      .sort({ createdAt: -1 });

    return NextResponse.json({ commissions });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch commissions" }, { status: 500 });
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
    const commission = await TicketCommission.create(body);
    return NextResponse.json({ message: "Commission created", commission }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create commission" }, { status: 500 });
  }
}
