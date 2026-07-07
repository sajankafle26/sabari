import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { User } from "@/lib/models";

const JWT_SECRET = process.env.JWT_SECRET || "sabari-jwt-secret-key-2026";

export async function authenticate(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: NextResponse.json({ message: "Authentication required" }, { status: 401 }), user: null };
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await User.findById(decoded.id) as any;

    if (!user || !user.isActive) {
      return { error: NextResponse.json({ message: "User not found or inactive" }, { status: 401 }), user: null };
    }

    return { error: null, user };
  } catch {
    return { error: NextResponse.json({ message: "Invalid or expired token" }, { status: 401 }), user: null };
  }
}

export function authorize(...roles: string[]) {
  return (user: any) => {
    if (!roles.includes(user.role)) {
      return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 });
    }
    return null;
  };
}
