import { NextRequest, NextResponse } from "next/server"
import { Expense } from "@/lib/models"
import { connectDB } from "@/lib/db"
import { authenticate } from "@/lib/middleware/auth"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, user } = await authenticate(request)
  if (error) return error

  const { id } = await params

  try {
    await connectDB()
    const expense = await Expense.findOneAndDelete({ _id: id, company: user.company })
    if (!expense) {
      return NextResponse.json({ message: "Expense not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Expense deleted" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to delete expense" }, { status: 500 })
  }
}
