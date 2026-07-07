import { NextRequest, NextResponse } from "next/server"
import { Notification } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await authenticate(request)
  if (error) return error

  const { id } = await params

  try {
    await connectDB()
    const notification = await Notification.findOneAndUpdate(
      { _id: id, $or: [{ recipient: user._id }, { recipientRole: user.role }] },
      { read: true },
      { new: true }
    )

    if (!notification) {
      return NextResponse.json({ message: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ notification })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to mark as read" }, { status: 500 })
  }
}
