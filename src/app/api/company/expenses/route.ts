import { NextRequest, NextResponse } from "next/server"
import { Expense } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function POST(request: NextRequest) {
  const { error, user } = await authenticate(request)
  if (error) return error

  try {
    await connectDB()
    const body = await request.json()

    const expense = await Expense.create({
      ...body,
      company: user.company,
      recordedBy: user._id,
    })

    const populated = await Expense.findById(expense._id)
      .populate("vehicle", "vehicleNumber")

    return NextResponse.json({ message: "Expense recorded", expense: populated }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to record expense" }, { status: 500 })
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
    const type = searchParams.get("type")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const vehicleId = searchParams.get("vehicle")

    const query: any = { company: user.company }
    if (type) query.type = type
    if (vehicleId) query.vehicle = vehicleId

    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = new Date(from)
      if (to) query.date.$lte = new Date(to)
    }

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate("vehicle", "vehicleNumber")
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Expense.countDocuments(query),
    ])

    const summary = await Expense.aggregate([
      { $match: { company: user.company } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ])

    return NextResponse.json({ expenses, total, page, totalPages: Math.ceil(total / limit), summary })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch expenses" }, { status: 500 })
  }
}
