import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/lib/models";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { sendOTP } from "@/lib/services/two-factor";
import { logAction } from "@/lib/services/audit";

const JWT_SECRET = process.env.JWT_SECRET || "sabari-jwt-secret-key-2026";

const loginRateLimit = rateLimit({ windowMs: 60000, max: 30 });

export async function POST(request: NextRequest) {
  const rateLimitError = loginRateLimit(request);
  if (rateLimitError) return rateLimitError;

  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    const user = await User.findOne({ email }) as any;
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: "Account is deactivated" }, { status: 403 });
    }

    await logAction({
      userId: String(user._id),
      action: "login_attempted",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (user.twoFactorEnabled) {
      const pendingToken = jwt.sign(
        { id: user._id, purpose: "2fa_login" },
        JWT_SECRET,
        { expiresIn: "10m" }
      );
      await sendOTP(String(user._id), user.phone, "login");
      return NextResponse.json({
        requires2FA: true,
        pendingToken,
        message: "Verification code sent to your phone",
      });
    }

    user.lastLogin = new Date();
    user.loginHistory.push({
      ip: request.headers.get("x-forwarded-for") || "unknown",
      device: request.headers.get("user-agent") || "unknown",
      timestamp: new Date(),
    });
    if (user.loginHistory.length > 50) user.loginHistory = user.loginHistory.slice(-50);
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    await logAction({
      userId: String(user._id),
      action: "login_success",
      resource: "user",
      resourceId: String(user._id),
      ip: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ message: "Login successful", token, user });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Login failed" }, { status: 500 });
  }
}
