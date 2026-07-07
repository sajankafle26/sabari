import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { logAction } from "@/lib/services/audit";

const JWT_SECRET = process.env.JWT_SECRET || "sabari-jwt-secret-key-2026";

const registerRateLimit = rateLimit({ windowMs: 60000, max: 5 });

export async function POST(request: NextRequest) {
  const rateLimitError = registerRateLimit(request);
  if (rateLimitError) return rateLimitError;

  try {
    await connectDB();
    const { firstName, lastName, email, phone, password, role } = await request.json();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 });
    }

    const user = await User.create({
      firstName, lastName, email, phone, password,
      role: role || "passenger",
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    logAction({
      userId: String(user._id),
      action: "user_registered",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return NextResponse.json({ message: "Registration successful", token, user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Registration failed" }, { status: 500 });
  }
}
