import { NextResponse } from "next/server";
import { authenticate } from "@/lib/middleware/auth";

export async function GET(request: Request) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  return NextResponse.json({ user });
}
