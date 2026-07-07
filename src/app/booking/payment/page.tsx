"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Wallet, Loader2, ExternalLink, Calendar, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn, formatPrice } from "@/lib/utils"
import { toNepaliDate } from "@/lib/nepali-date"
import { useBooking } from "@/lib/context/booking-context"
import { toast } from "sonner"
import axios from "axios"

interface PaymentMethod {
  id: string
  label: string
  icon: string
  description: string
}

export default function PaymentPage() {
  const router = useRouter()
  const { data, clearData } = useBooking()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState("esewa")
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    axios.get("/api/payments/methods").then((res) => {
      setMethods(res.data.methods || [])
      if (res.data.methods?.length > 0) {
        setSelectedMethod(res.data.methods[0].id)
      }
    }).catch(() => {
      setMethods([
        { id: "esewa", label: "eSewa", icon: "💳", description: "Pay with eSewa wallet" },
        { id: "khalti", label: "Khalti", icon: "💳", description: "Pay with Khalti" },
        { id: "cash", label: "Cash", icon: "💵", description: "Pay at counter" },
      ])
    })
  }, [])

  const seatCount = data.seats?.length || 1
  const pricePerSeat = data.pricePerSeat || 1200
  const serviceFee = data.serviceFee || 50
  const total = data.totalAmount || (pricePerSeat * seatCount + serviceFee)
  const baseSeatTotal = pricePerSeat * seatCount

  const handlePayment = async () => {
    const token = localStorage.getItem("sabari_token")
    if (!token) {
      router.push("/auth/login?redirect=/booking/payment")
      return
    }

    setLoading(true)
    setProcessing(true)

    try {
      const bookingRes = await axios.post(
        "/api/bookings",
        {
          schedule: data.vehicleId || "mock_schedule",
          route: data.vehicleId || "mock_route",
          vehicle: data.vehicleId || "mock_vehicle",
          passengers: data.passengers.map((p) => ({
            name: p.name,
            phone: p.phone,
            email: p.email,
            age: Number(p.age) || 0,
            gender: p.gender,
            seatNumber: p.seatNumber,
          })),
          journeyDate: data.journeyDate || new Date().toISOString(),
          totalAmount: total,
          paymentMethod: selectedMethod,
          bookingStatus: "pending",
          paymentStatus: "pending",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const bookingId = bookingRes.data.booking._id || bookingRes.data.booking.id

      if (selectedMethod === "cash") {
        toast.success("Booking confirmed! Pay at the counter.")
        clearData()
        router.push(`/booking/confirmation?bookingId=${bookingId}`)
        return
      }

      const initRes = await axios.post(
        "/api/payments/initiate",
        {
          bookingId,
          gateway: selectedMethod,
          amount: total,
          metadata: {
            productName: "Bus Ticket",
            productUrl: `${window.location.origin}/booking/confirmation`,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { formAction, formFields } = initRes.data

      if (formAction && formFields) {
        const form = document.createElement("form")
        form.method = "POST"
        form.action = formAction
        form.style.display = "none"

        if (selectedMethod === "khalti") {
          Object.entries(formFields).forEach(([key, value]) => {
            const input = document.createElement("input")
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          })
          form.target = "_blank"
          document.body.appendChild(form)
          form.submit()
          document.body.removeChild(form)
          setLoading(false)
          toast.success("Payment link opened in new tab. Complete payment, then come back to verify.")
          return
        }

        Object.entries(formFields).forEach(([key, value]) => {
          const input = document.createElement("input")
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)
      } else {
        await axios.post(
          "/api/payments/verify",
          {
            gateway: selectedMethod,
            transactionId: initRes.data.transactionId,
            gatewayParams: { status: "completed" },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        toast.success("Payment successful!")
        clearData()
        router.push(`/booking/confirmation?bookingId=${bookingId}`)
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Payment failed"
      toast.error(message)
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-violet-600 transition-colors mb-3">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <h1 className="text-2xl font-bold text-zinc-900 mb-1">Payment</h1>
      <p className="text-zinc-500 mb-6">Choose your payment method to complete the booking</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-3 space-y-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              disabled={processing}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                selectedMethod === method.id
                  ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-600/10"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm"
              )}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-100 text-2xl">
                {method.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-900">{method.label}</p>
                <p className="text-xs text-zinc-500">{method.description}</p>
              </div>
              {selectedMethod === method.id && (
                <CheckCircle className="h-5 w-5 text-violet-600" />
              )}
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5 text-sm">
                {data.journeyDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Travel Date</span>
                    <div className="text-right">
                      <span className="text-zinc-900 font-medium">{data.journeyDate}</span>
                      <div className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                        <Calendar className="h-3 w-3" />
                        {toNepaliDate(data.journeyDate)} BS
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-zinc-500">
                  <span>Seats ({seatCount})</span>
                  <span className="text-zinc-900 font-medium">{formatPrice(baseSeatTotal)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Service Fee</span>
                  <span className="text-zinc-900 font-medium">{formatPrice(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Discount</span>
                  <span className="text-green-600 font-medium">-{formatPrice(data.discount || 0)}</span>
                </div>
                <hr className="border-zinc-100" />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-zinc-900">Total</span>
                  <span className="text-violet-600">{formatPrice(total)}</span>
                </div>
              </div>

              <Button size="lg" className="w-full font-semibold" onClick={handlePayment} disabled={loading || processing}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedMethod === "cash" ? (
                      <>
                        <Wallet className="h-4 w-4" />
                        Confirm Booking
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        Pay {formatPrice(total)}
                      </>
                    )}
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                Secured by SSL encryption
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
