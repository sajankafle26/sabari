import { NextRequest, NextResponse } from "next/server"
import { Payment, Booking } from "@/lib/models"
import { connectDB } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ gateway: string }> }) {
  const { gateway } = await params
  try {
    await connectDB()
    const body = await request.json()
    const { transactionId, status, refId, ...rest } = body

    let query: any = {}

    if (transactionId) query.transactionId = transactionId
    else if (body.pid) query.transactionId = body.pid
    else if (body.RRN) query.transactionId = body.RRN
    else if (body.TxnId) query.transactionId = body.TxnId
    else if (body.txnId) query.transactionId = body.txnId

    if (!Object.keys(query).length) {
      return NextResponse.json({ message: "No transaction identifier found" }, { status: 400 })
    }

    const payment = await Payment.findOne(query)
    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 })
    }

    const isSuccess =
      status === "success" ||
      status === "Success" ||
      status === "completed" ||
      status === "Completed" ||
      status === "Success" ||
      body.STATUS === "Success" ||
      body.ResponseCode === "0"

    if (isSuccess) {
      payment.status = "success"
      payment.gatewayResponse = body
      payment.gatewayRef = refId || body.refId || body.refId || body.pidx || body.RRN || ""
      payment.paidAt = new Date()
      await payment.save()

      await Booking.findByIdAndUpdate(payment.booking, {
        paymentStatus: "paid",
        bookingStatus: "confirmed",
      })

      return NextResponse.json({ message: "Payment verified via callback" })
    }

    payment.status = "failed"
    payment.gatewayResponse = body
    await payment.save()

    return NextResponse.json({ message: "Payment failed" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Callback handling failed" }, { status: 500 })
  }
}
