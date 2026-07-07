"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Bus, MapPin, Calendar, Download, Printer, Share2, Loader2, AlertCircle, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useBooking } from "@/lib/context/booking-context"
import { formatPrice } from "@/lib/utils"
import { toNepaliDate } from "@/lib/nepali-date"
import { QRCodeSVG } from "qrcode.react"
import axios from "axios"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data, clearData } = useBooking()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const bookingId = searchParams.get("bookingId") || searchParams.get("txn")

  useEffect(() => {
    if (!bookingId) {
      setLoading(false)
      setError("No booking ID found. Please check your bookings for details.")
      return
    }

    const token = localStorage.getItem("sabari_token")
    if (!token) {
      setLoading(false)
      setError("Please log in to view your booking.")
      return
    }

    axios
      .get(`/api/bookings?search=${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const bookings = res.data.bookings || []
        const found = bookings.find(
          (b: any) => b.bookingId === bookingId || b._id === bookingId
        )
        if (found) {
          setBooking(found)
          clearData()
        } else {
          setError("Booking not found")
        }
      })
      .catch(() => {
        setError("Failed to load booking details")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [bookingId, clearData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-zinc-500">Loading booking details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Oops!</h1>
          <p className="text-zinc-500 mt-1">{error}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/my-bookings">
            <Button size="lg" className="w-full">View My Bookings</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg" className="w-full">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const bk = booking || {
    _id: "",
    bookingId: bookingId || data.vehicleId || "SBR-000000-0000",
    journeyDate: data.journeyDate || new Date().toISOString(),
    totalAmount: data.totalAmount || 0,
    paymentMethod: data.paymentMethod || "esewa",
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    passengers: data.passengers.map((p: any) => ({ name: p.name, seatNumber: p.seatNumber })),
  }

  const passengerNames = bk.passengers?.map((p: any) => p.name).join(", ") || "N/A"
  const seatNumbers = bk.passengers?.map((p: any) => p.seatNumber).join(", ") || "N/A"
  const routeFrom = bk.route?.from || data.fromCity || "Kathmandu"
  const routeTo = bk.route?.to || data.toCity || "Pokhara"
  const vehicleName = bk.vehicle?.vehicleNumber || data.vehicleNumber || "Ba 1 Kha 1234"
  const departureTime = bk.schedule?.departureTime || data.departureTime || "06:00"
  const arrivalTime = bk.schedule?.arrivalTime || data.arrivalTime || "11:00"
  const journeyDate = bk.journeyDate
    ? new Date(bk.journeyDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : "Today"
  const journeyDateNepali = bk.journeyDate ? toNepaliDate(bk.journeyDate) : ""

  return (
    <div>
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Booking Confirmed!</h1>
        <p className="text-zinc-500 mt-1">Your ticket has been booked successfully.</p>
      </div>

      {/* Ticket Card */}
      <Card className="border-violet-200 overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Sabari</p>
                  <p className="text-xs text-white/70">Booking ID: {bk.bookingId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Travel Date</p>
                <p className="text-sm text-white font-medium">{journeyDate}</p>
                {journeyDateNepali && <p className="text-xs text-yellow-300 font-medium">{journeyDateNepali} BS</p>}
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-900">{departureTime}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{routeFrom}</p>
              </div>
              <div className="flex-1 mx-6 relative">
                <div className="border-t-2 border-dashed border-zinc-200" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-zinc-200">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    5 hrs
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-900">{arrivalTime}</p>
                <p className="text-sm text-zinc-500 mt-0.5">{routeTo}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 pb-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Passenger</span>
              <span className="text-zinc-900 font-medium">{passengerNames}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Seats</span>
              <span className="text-zinc-900 font-medium">{seatNumbers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Vehicle</span>
              <span className="text-zinc-900 font-medium">{vehicleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Amount Paid</span>
              <span className="text-violet-600 font-bold">{formatPrice(bk.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment</span>
              <span className="text-green-600 font-medium">Paid via {bk.paymentMethod}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="px-6 pb-5 flex justify-center">
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-zinc-100">
              <QRCodeSVG value={bk.bookingId || "SAB-DEFAULT"} size={120} level="M" />
            </div>
          </div>
          <p className="text-center text-xs text-zinc-400 pb-4">Scan to Board • {bk.bookingId}</p>

          {/* Perforated edge */}
          <div className="border-t-2 border-dashed border-zinc-200 mx-6" />

          {/* Actions */}
          <div className="px-6 py-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex gap-3 mt-6">
        <Link href="/tracking" className="flex-1">
          <Button size="lg" className="w-full font-semibold">
            <MapPin className="h-4 w-4" />
            Track Vehicle Live
          </Button>
        </Link>
        <Link href="/my-bookings" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            My Bookings
          </Button>
        </Link>
      </div>

      <p className="text-center text-xs text-zinc-400 mt-4">
        A confirmation SMS and email have been sent to your registered contact.
      </p>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <p className="text-zinc-500">Loading...</p>
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
    </div>
  )
}
