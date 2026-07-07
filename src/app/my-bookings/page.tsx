"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bus, MapPin, ArrowRight, XCircle, Download, Loader2, Ban } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice, formatDate } from "@/lib/utils"
import { toNepaliDate } from "@/lib/nepali-date"
import { toast } from "sonner"
import axios from "axios"

interface BookingItem {
  _id: string
  bookingId: string
  totalAmount: number
  bookingStatus: string
  paymentStatus: string
  journeyDate: string
  route?: { from: string; to: string }
  vehicle?: { vehicleNumber: string; type: string }
  schedule?: { departureTime: string; arrivalTime: string }
  passengers: Array<{ name: string; seatNumber: string }>
}

const statusStyles: Record<string, string> = {
  confirmed: "text-green-600 bg-green-600/10",
  pending: "text-yellow-600 bg-yellow-600/10",
  completed: "text-blue-600 bg-blue-600/10",
  cancelled: "text-red-600 bg-red-600/10",
  refunded: "text-orange-400 bg-orange-600/10",
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchBookings = async () => {
    const token = localStorage.getItem("sabari_token")
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await axios.get("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBookings(data.bookings || [])
    } catch {
      // fallback to empty
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleCancel = async (id: string) => {
    const reason = prompt("Reason for cancellation (optional):")
    if (reason === null) return

    if (!confirm("Are you sure you want to cancel this booking? Refund rules will apply based on time remaining before departure.")) {
      return
    }

    const token = localStorage.getItem("sabari_token")
    setCancelling(id)

    try {
      const { data } = await axios.post(
        `/api/bookings/${id}/cancel`,
        { reason: reason || "Cancelled by user" },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        fetchBookings()
      } else {
        toast.error(data.message)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancellation failed")
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">My Bookings</h1>
      <p className="text-zinc-500 mb-6">View and manage your bookings</p>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Ban className="h-12 w-12 text-zinc-700 mb-3" />
            <p className="text-zinc-500">No bookings found</p>
            <Link href="/booking/search" className="mt-4">
              <Button>Book a Trip</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = booking.bookingStatus || "pending"
            const seats = booking.passengers?.map((p: any) => p.seatNumber).join(", ") || "N/A"
            const passengerNames = booking.passengers?.map((p: any) => p.name).join(", ") || "N/A"
            const routeStr = `${booking.route?.from || "N/A"} → ${booking.route?.to || "N/A"}`
            const canCancel = status === "confirmed" || status === "pending"

            return (
              <Card key={booking._id} className="hover:border-violet-500/30 transition-all duration-300">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-violet-50 shrink-0">
                      <Bus className="h-7 w-7 text-violet-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-zinc-900">{routeStr}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || "text-zinc-500 bg-zinc-700/50"}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                        <span>{formatDate(booking.journeyDate)} <span className="text-violet-600 text-xs">({toNepaliDate(booking.journeyDate)} BS)</span></span>
                        <span>{booking.schedule?.departureTime || "N/A"}</span>
                        <span>{booking.vehicle?.vehicleNumber || "N/A"}</span>
                        <span>Seats: {seats}</span>
                        <span className="text-zinc-900 font-medium">{formatPrice(booking.totalAmount)}</span>
                      </div>

                      <p className="text-xs text-zinc-600 mt-1">
                        Booking ID: {booking.bookingId} • {passengerNames}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-300"
                          onClick={() => handleCancel(booking._id)}
                          loading={cancelling === booking._id}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                      <Link href="/tracking">
                        <Button variant="outline" size="sm">
                          <MapPin className="h-3.5 w-3.5" />
                          Track
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Download className="h-3.5 w-3.5" />
                        Ticket
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
