import { NextRequest, NextResponse } from "next/server"
import { Parcel } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request)
  if (error) return error

  const { id } = await params

  try {
    await connectDB()
    const { status, note, location } = await request.json()

    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 })
    }

    const parcel = await Parcel.findById(id)
    if (!parcel) {
      return NextResponse.json({ message: "Parcel not found" }, { status: 404 })
    }

    if (String(parcel.company) !== String(user.company) && user.role !== "super_admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    parcel.status = status
    parcel.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: user._id,
      note: note || "",
      location: location || "",
    })

    if (status === "delivered") {
      parcel.deliveredAt = new Date()
      if (parcel.cod) parcel.codPaid = true
    }

    await parcel.save()

    const populated = await Parcel.findById(id)
      .populate("route", "from to")
      .populate("company", "name")

    return NextResponse.json({ message: `Status updated to ${status}`, parcel: populated })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to update status" }, { status: 500 })
  }
}
