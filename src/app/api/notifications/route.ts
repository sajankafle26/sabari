import { NextRequest, NextResponse } from "next/server"
import { Notification } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"
import { sendNotification } from "@/lib/services/notification"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = parseInt(searchParams.get("skip") || "0")
    const unreadOnly = searchParams.get("unread") === "true"

    const query: any = {
      $or: [
        { recipient: user._id },
        { recipientRole: user.role },
      ],
    }
    if (unreadOnly) query.read = false

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({
        $or: [{ recipient: user._id }, { recipientRole: user.role }],
        read: false,
      }),
    ])

    return NextResponse.json({ notifications, total, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    const body = await request.json()
    const result = await sendNotification({
      ...body,
      recipient: body.recipient || user._id,
    })

    return NextResponse.json({ message: "Notification sent", result }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to send notification" }, { status: 500 })
  }
}
