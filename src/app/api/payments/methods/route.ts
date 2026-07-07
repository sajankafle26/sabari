import { NextResponse } from "next/server"
import { Setting } from "@/lib/models"
import { connectDB } from "@/lib/db"

const defaultMethods = [
  { id: "esewa", label: "eSewa", icon: "💳", description: "Pay with eSewa wallet" },
  { id: "khalti", label: "Khalti", icon: "💳", description: "Pay with Khalti" },
  { id: "fonepay", label: "Fonepay", icon: "💳", description: "Pay with Fonepay" },
  { id: "imepay", label: "IME Pay", icon: "💳", description: "Pay with IME Pay" },
  { id: "connectips", label: "ConnectIPS", icon: "🏦", description: "Pay via online banking" },
  { id: "cash", label: "Cash", icon: "💵", description: "Pay at counter" },
]

export async function GET() {
  try {
    await connectDB()
    const settings = await Setting.find({ category: "payment" })
    const disabledGateways = new Set(
      settings
        .filter((s) => s.value?.enabled === false)
        .map((s) => s.key.replace("payment_", ""))
    )

    const methods = defaultMethods.filter((m) => {
      if (m.id === "cash") return true
      return !disabledGateways.has(m.id)
    })

    const gatewaySettings: Record<string, any> = {}
    for (const s of settings) {
      const key = s.key.replace("payment_", "")
      gatewaySettings[key] = {
        configured: !!(s.value?.merchantCode || s.value?.publicKey || s.value?.merchantId),
        sandbox: s.value?.sandbox !== false,
      }
    }

    return NextResponse.json({ methods, gatewaySettings })
  } catch (error: any) {
    return NextResponse.json({
      methods: defaultMethods,
      gatewaySettings: {},
    })
  }
}
