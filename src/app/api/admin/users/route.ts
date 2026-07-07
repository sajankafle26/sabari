import { NextRequest, NextResponse } from "next/server";
import { User } from "@/lib/models";
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
    if (searchParams.get("role")) query.role = searchParams.get("role");
    if (searchParams.get("isActive")) query.isActive = searchParams.get("isActive") === "true";
    if (searchParams.get("company")) query.company = searchParams.get("company");
    if (searchParams.get("search")) {
      const search = searchParams.get("search");
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .populate("company", "name")
      .populate("counter", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch users" }, { status: 500 });
  }
}
