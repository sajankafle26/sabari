import { NextRequest, NextResponse } from "next/server"
import { AuditLog } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  if (user.role !== "super_admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  await connectDB()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const action = searchParams.get("action")
  const resource = searchParams.get("resource")
  const userId = searchParams.get("userId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const filter: Record<string, any> = {}

  if (action) filter.action = { $regex: action, $options: "i" }
  if (resource) filter.resource = { $regex: resource, $options: "i" }
  if (userId) filter.user = userId
  if (from || to) {
    filter.createdAt = {}
    if (from) filter.createdAt.$gte = new Date(from)
    if (to) filter.createdAt.$lte = new Date(to)
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ])

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
