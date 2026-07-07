import { NextRequest, NextResponse } from "next/server"
import { Parcel } from "@/lib/models"
import { connectDB } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params

  try {
    await connectDB()

    const parcel = await Parcel.findOne({ trackingId: trackingId.toUpperCase() })
      .populate("route", "from to")
      .populate("company", "name phone")

    if (!parcel) {
      return NextResponse.json({ message: "Parcel not found" }, { status: 404 })
    }

    return NextResponse.json({ parcel })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Tracking failed" }, { status: 500 })
  }
}
