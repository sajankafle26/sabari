import { NextRequest, NextResponse } from "next/server";
import { Setting } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { authenticate, authorize } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request);
  if (error) return error;
  const authError = authorize("super_admin")(user);
  if (authError) return authError;

  try {
    await connectDB();
    const settings = await Setting.find().sort({ category: 1, key: 1 });

    const grouped: Record<string, any[]> = {};
    for (const setting of settings) {
      const s = setting as any;
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category].push({ key: s.key, value: s.value, description: s.description, category: s.category });
    }

    return NextResponse.json({ settings: grouped });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch settings" }, { status: 500 });
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

    if (body.key && body.value !== undefined) {
      const setting = await Setting.findOneAndUpdate(
        { key: body.key },
        { value: body.value, description: body.description, category: body.category },
        { new: true, upsert: true, runValidators: true }
      );
      return NextResponse.json({ message: "Setting updated", setting });
    }

    if (Array.isArray(body)) {
      const results = [];
      for (const item of body) {
        const setting = await Setting.findOneAndUpdate(
          { key: item.key },
          { value: item.value, description: item.description, category: item.category },
          { new: true, upsert: true }
        );
        results.push(setting);
      }
      return NextResponse.json({ message: "Settings updated", settings: results });
    }

    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update settings" }, { status: 500 });
  }
}
