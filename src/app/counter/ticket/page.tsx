"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Printer,
  Ban,
  MoveHorizontal,
  CalendarDays,
  Bus,
  MapPin,
  X,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CounterLayout } from "@/components/counter/counter-layout"
import api from "@/lib/api"
import { QRCodeSVG } from "qrcode.react"
import { formatDateWithNepali } from "@/lib/utils"
import { HorizontalDatePicker } from "@/components/ui/horizontal-date-picker"

function mapBooking(raw: any) {
  const routeStr = raw.route
    ? typeof raw.route === "object"
      ? `${raw.route.from || ""} → ${raw.route.to || ""}`
      : raw.route
    : "—"
  const vehicleStr = raw.vehicle
    ? typeof raw.vehicle === "object"
      ? `${raw.vehicle.vehicleNumber || ""} (${raw.vehicle.type || ""})`
      : raw.vehicle
    : "—"
  const passengerName = raw.bookedBy
    ? `${raw.bookedBy.firstName || ""} ${raw.bookedBy.lastName || ""}`.trim() || raw.bookedBy.phone || "—"
    : raw.customerName || "—"
  const passengerPhone = raw.bookedBy?.phone || raw.customerPhone || "—"
  const passengerEmail = raw.bookedBy?.email || raw.customerEmail || "—"
  const seatsStr = raw.passengers?.map((p: any) => p.seatNumber).join(", ") || "—"
  const departure = raw.schedule
    ? typeof raw.schedule === "object"
      ? raw.schedule.departureTime || "—"
      : "—"
    : "—"
  const arrival = raw.schedule
    ? typeof raw.schedule === "object"
      ? raw.schedule.arrivalTime || "—"
      : "—"
    : "—"

  return {
    _id: raw._id,
    bookingId: raw.bookingId || "—",
    passenger: passengerName,
    phone: passengerPhone,
    email: passengerEmail,
    route: routeStr,
    vehicle: vehicleStr,
    date: raw.journeyDate,
    departure,
    arrival,
    seats: seatsStr,
    amount: raw.totalAmount ?? 0,
    paymentStatus: raw.paymentStatus || "pending",
    status: raw.bookingStatus || "pending",
    passengerCount: raw.passengers?.length || 0,
    passengers: raw.passengers || [],
    qrCode: raw.qrCode,
  }
}

function TicketContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("bookingId")

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCancel, setShowCancel] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showChangeDate, setShowChangeDate] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [newSeat, setNewSeat] = useState("")
  const [newDate, setNewDate] = useState("")
  const [submitting, setSubmitting] = useState<string | null>(null)

  useEffect(() => {
    if (!bookingId) {
      setLoading(false)
      return
    }
    api.get(`/counter/bookings/${bookingId}`)
      .then(res => setBooking(mapBooking(res.data.booking || res.data)))
      .catch(() => {
        toast.error("Failed to load booking")
        setBooking(null)
      })
      .finally(() => setLoading(false))
  }, [bookingId])

  const handlePrint = () => window.print()

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason")
      return
    }
    setSubmitting("cancel")
    try {
      const res = await api.delete(`/counter/bookings/${booking._id}`, { data: { reason: cancelReason } })
      setBooking(mapBooking(res.data.booking))
      toast.success("Booking cancelled")
      setShowCancel(false)
      setCancelReason("")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel booking")
    } finally {
      setSubmitting(null)
    }
  }

  const handleTransfer = async () => {
    if (!newSeat.trim()) {
      toast.error("Please select a new seat")
      return
    }
    setSubmitting("transfer")
    try {
      const newSeats = newSeat.split(",").map(s => s.trim())
      const res = await api.patch(`/counter/bookings/${booking._id}/transfer`, { newSeats })
      setBooking(mapBooking(res.data.booking))
      toast.success("Seat transferred")
      setShowTransfer(false)
      setNewSeat("")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to transfer seat")
    } finally {
      setSubmitting(null)
    }
  }

  const handleChangeDate = async () => {
    if (!newDate) {
      toast.error("Please select a new date")
      return
    }
    setSubmitting("date")
    try {
      const res = await api.patch(`/counter/bookings/${booking._id}/change-date`, { newDate })
      setBooking(mapBooking(res.data.booking))
      toast.success("Date changed")
      setShowChangeDate(false)
      setNewDate("")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change date")
    } finally {
      setSubmitting(null)
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "text-green-600 bg-green-600/10",
      pending: "text-yellow-600 bg-yellow-600/10",
      cancelled: "text-red-600 bg-red-600/10",
      completed: "text-blue-600 bg-blue-600/10",
      paid: "text-green-600 bg-green-600/10",
      unpaid: "text-yellow-600 bg-yellow-600/10",
      refunded: "text-purple-600 bg-purple-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <CounterLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Booking Details</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <div className="h-8 w-8 text-violet-600 animate-spin border-2 border-current border-t-transparent rounded-full" />
          </div>
        </div>
      </CounterLayout>
    )
  }

  if (!booking) {
    return (
      <CounterLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Booking Details</h1>
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <X className="h-12 w-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 mt-4">No booking ID provided</p>
                <p className="text-zinc-600 text-sm mt-1">Use the search page to find a booking</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CounterLayout>
    )
  }

  return (
    <CounterLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Booking Details</h1>
            <p className="text-zinc-500 mt-1">#{booking.bookingId}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="h-5 w-5 text-violet-600" />
                    Ticket Information
                  </CardTitle>
                  {statusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Route</p>
                    <p className="text-zinc-200 font-medium">{booking.route}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Vehicle</p>
                    <p className="text-zinc-200 font-medium">{booking.vehicle}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Date</p>
                    <p className="text-zinc-200 font-medium">{booking.date ? formatDateWithNepali(booking.date) : "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Departure</p>
                    <p className="text-zinc-200 font-medium">{booking.departure || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Arrival</p>
                    <p className="text-zinc-200 font-medium">{booking.arrival || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Seats</p>
                    <p className="text-zinc-200 font-medium">{booking.seats}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Passengers</p>
                    <p className="text-zinc-200 font-medium">{booking.passengerCount ?? 1}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Payment</p>
                    <div className="mt-0.5">{statusBadge(booking.paymentStatus)}</div>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Amount</p>
                    <p className="text-zinc-200 font-medium">Rs. {booking.amount?.toLocaleString() ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-violet-600" />
                  Passenger Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Name</p>
                    <p className="text-zinc-200 font-medium">{booking.passenger || booking.customerName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Phone</p>
                    <p className="text-zinc-200 font-medium">{booking.phone || booking.customerPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Email</p>
                    <p className="text-zinc-200 font-medium">{booking.email || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-40 h-40 bg-white rounded-xl mb-3 p-2">
                    {booking.qrCode ? (
                      <img src={booking.qrCode} alt="QR Code" className="w-36 h-36" />
                    ) : (
                      <QRCodeSVG value={booking.bookingId} size={140} level="M" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">Scan QR code at boarding gate</p>
                  <p className="text-[10px] text-zinc-600 mt-1">{booking.bookingId}</p>
                </div>
              </CardContent>
            </Card>

            {booking.status !== "cancelled" && booking.status !== "completed" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-zinc-700">Actions</CardTitle>
                  <CardDescription>Manage this booking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setShowCancel(true)} disabled={!!submitting}>
                      <Ban className="h-4 w-4" /> Cancel Booking
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowTransfer(true)} disabled={!!submitting}>
                      <MoveHorizontal className="h-4 w-4" /> Seat Transfer
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowChangeDate(true)} disabled={!!submitting}>
                      <CalendarDays className="h-4 w-4" /> Change Date
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-200 font-medium">Booking Created</p>
                      <p className="text-[10px] text-zinc-500">Today, 10:30 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-200 font-medium">Payment {booking.paymentStatus}</p>
                      <p className="text-[10px] text-zinc-500">Today, 10:31 AM</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${booking.status === "confirmed" ? "bg-green-400" : "bg-zinc-600"} mt-1.5 shrink-0`} />
                    <div>
                      <p className="text-xs text-zinc-200 font-medium">Ticket Confirmed</p>
                      <p className="text-[10px] text-zinc-500">Today, 10:31 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowCancel(false)} />
            <div className="relative w-full max-w-md rounded-xl bg-white border border-zinc-200 shadow-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Cancel Booking</h2>
              <p className="text-sm text-zinc-500">Are you sure you want to cancel booking #{booking.bookingId}?</p>
              <Input
                label="Cancellation Reason"
                placeholder="Enter reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowCancel(false)} disabled={!!submitting}>Close</Button>
                <Button variant="danger" size="sm" onClick={handleCancel} disabled={submitting === "cancel"}>
                  {submitting === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting === "cancel" ? "Cancelling..." : "Confirm Cancel"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Seat Transfer Modal */}
        {showTransfer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowTransfer(false)} />
            <div className="relative w-full max-w-md rounded-xl bg-white border border-zinc-200 shadow-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Seat Transfer</h2>
              <p className="text-sm text-zinc-500">Current seat: {booking.seats}</p>
              <Input
                label="New Seat Number(s)"
                placeholder="e.g. S15 or S15, S16"
                value={newSeat}
                onChange={(e) => setNewSeat(e.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowTransfer(false)} disabled={!!submitting}>Close</Button>
                <Button variant="primary" size="sm" onClick={handleTransfer} disabled={submitting === "transfer"}>
                  {submitting === "transfer" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting === "transfer" ? "Transferring..." : "Transfer Seat"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Change Date Modal */}
        {showChangeDate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowChangeDate(false)} />
            <div className="relative w-full max-w-md rounded-xl bg-white border border-zinc-200 shadow-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Change Travel Date</h2>
              <p className="text-sm text-zinc-500">Current date: {booking.date ? new Date(booking.date).toLocaleDateString() : "-"}</p>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">New Travel Date</label>
                <HorizontalDatePicker value={newDate} onChange={setNewDate} />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowChangeDate(false)} disabled={!!submitting}>Close</Button>
                <Button variant="primary" size="sm" onClick={handleChangeDate} disabled={submitting === "date"}>
                  {submitting === "date" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting === "date" ? "Updating..." : "Change Date"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CounterLayout>
  )
}

export default function TicketPage() {
  return (
    <Suspense fallback={
      <CounterLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Booking Details</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <div className="h-8 w-8 text-violet-600 animate-spin border-2 border-current border-t-transparent rounded-full" />
          </div>
        </div>
      </CounterLayout>
    }>
      <TicketContent />
    </Suspense>
  )
}
