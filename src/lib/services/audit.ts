import { AuditLog } from "@/lib/models"
import { connectDB } from "@/lib/db"

export async function logAction(params: {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
}) {
  try {
    await connectDB()
    await AuditLog.create({
      user: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ip: params.ip,
      userAgent: params.userAgent,
    })
  } catch {
  }
}
