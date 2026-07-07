import { NextRequest, NextResponse } from "next/server"
import { Notification } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const count = await Notification.countDocuments({
      $or: [
        { recipient: user._id },
        { recipientRole: user.role },
      ],
      read: false,
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ count: 0 })
  }
}
