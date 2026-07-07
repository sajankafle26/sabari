import { NextRequest, NextResponse } from "next/server"
import { Parcel } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const body = await request.json()

    const parcel = await Parcel.create({
      ...body,
      company: body.company || user.company,
      createdBy: user._id,
      counter: user.counter,
      statusHistory: [{
        status: "pending",
        timestamp: new Date(),
        updatedBy: user._id,
        note: "Parcel registered",
      }],
    })

    const populated = await Parcel.findById(parcel._id)
      .populate("route", "from to")
      .populate("company", "name")

    return NextResponse.json({ message: "Parcel created", parcel: populated }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to create parcel" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const query: any = {}
    if (user.company) query.company = user.company
    if (status) query.status = status

    if (search) {
      query.$or = [
        { trackingId: { $regex: search, $options: "i" } },
        { "sender.name": { $regex: search, $options: "i" } },
        { "sender.phone": { $regex: search, $options: "i" } },
        { "receiver.name": { $regex: search, $options: "i" } },
        { "receiver.phone": { $regex: search, $options: "i" } },
      ]
    }

    const [parcels, total] = await Promise.all([
      Parcel.find(query)
        .populate("route", "from to")
        .populate("company", "name")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Parcel.countDocuments(query),
    ])

    return NextResponse.json({ parcels, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch parcels" }, { status: 500 })
  }
}
