"use client"

import { useState } from "react"
import Link from "next/link"
import { Bus, ArmchairIcon, ArrowLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatPrice } from "@/lib/utils"
import { toNepaliDate } from "@/lib/nepali-date"
import { useBooking } from "@/lib/context/booking-context"

interface Seat {
  id: string
  row: number
  col: number
  label: string
  status: "available" | "booked" | "reserved" | "blocked" | "female" | "vip" | "disabled"
}

const generateSeats = (): Seat[] => {
  const seats: Seat[] = []
  const statuses: Seat["status"][] = ["available", "available", "available", "booked", "available", "available", "reserved", "available", "available", "female", "available", "available", "available", "vip", "booked", "available", "available", "available", "disabled", "available"]
  let idx = 0
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 2; col++) {
      const label = String.fromCharCode(65 + row - 1) + col
      seats.push({
        id: label,
        row,
        col,
        label,
        status: statuses[idx % statuses.length],
      })
      idx++
    }
  }
  return seats
}

const statusStyles: Record<Seat["status"], string> = {
  available: "bg-white text-zinc-600 hover:bg-violet-600 hover:text-white cursor-pointer border-zinc-200 hover:border-violet-600 shadow-sm",
  booked: "bg-red-50 text-red-400 cursor-not-allowed border-red-200",
  reserved: "bg-amber-50 text-amber-500 cursor-not-allowed border-amber-200",
  blocked: "bg-zinc-50 text-zinc-300 cursor-not-allowed border-zinc-100",
  female: "bg-pink-50 text-pink-500 border-pink-200",
  vip: "bg-amber-50 text-amber-600 border-amber-200",
  disabled: "bg-blue-50 text-blue-500 border-blue-200",
}

export default function SelectSeatPage() {
  const { data, updateData } = useBooking()
  const [selectedSeats, setSelectedSeats] = useState<string[]>(data.seats || [])
  const [seats] = useState<Seat[]>(generateSeats)
  const pricePerSeat = 1200

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== "available") return
    setSelectedSeats((prev) =>
      prev.includes(seat.id) ? prev.filter((s) => s !== seat.id) : [...prev, seat.id]
    )
  }

  const handleContinue = () => {
    const total = pricePerSeat * selectedSeats.length + (selectedSeats.length > 0 ? 50 : 0)
    updateData({
      seats: selectedSeats,
      pricePerSeat,
      serviceFee: 50,
      totalAmount: total,
    })
  }

  const leftCol = seats.filter((s) => s.col === 1)
  const rightCol = seats.filter((s) => s.col === 2)

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/booking/search" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-violet-600 transition-colors mb-3">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to results
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Select Your Seat</h1>
        <p className="text-zinc-500 text-sm">
          {data.vehicleName || "Sworgadwari Travels"} • {data.fromCity || "Kathmandu"} → {data.toCity || "Pokhara"} • {data.departureTime || "06:00 AM"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seat Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="h-5 w-5 text-violet-600" />
                Bus Layout (2x2)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-12 rounded-xl bg-gradient-to-b from-zinc-200 to-zinc-100 border border-zinc-200 flex items-center justify-center text-xs text-zinc-500 font-medium shadow-sm">
                  Driver
                </div>
              </div>

              <div className="flex justify-center gap-12">
                <div className="space-y-2">
                  {leftCol.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status !== "available"}
                      className={`
                        w-14 h-12 rounded-xl border text-xs font-medium transition-all duration-150
                        ${statusStyles[seat.status]}
                        ${selectedSeats.includes(seat.id) ? "!bg-violet-600 !text-white !border-violet-600 shadow-lg shadow-violet-600/25" : ""}
                      `}
                      title={`Seat ${seat.label} - ${seat.status}`}
                    >
                      <ArmchairIcon className="h-4 w-4 mx-auto" />
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {rightCol.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={seat.status !== "available"}
                      className={`
                        w-14 h-12 rounded-xl border text-xs font-medium transition-all duration-150
                        ${statusStyles[seat.status]}
                        ${selectedSeats.includes(seat.id) ? "!bg-violet-600 !text-white !border-violet-600 shadow-lg shadow-violet-600/25" : ""}
                      `}
                      title={`Seat ${seat.label} - ${seat.status}`}
                    >
                      <ArmchairIcon className="h-4 w-4 mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-zinc-100">
                {[
                  { status: "available", label: "Available", cls: "bg-white border-zinc-200" },
                  { status: "selected", label: "Selected", cls: "bg-violet-600" },
                  { status: "booked", label: "Booked", cls: "bg-red-50 border-red-200" },
                  { status: "female", label: "Female Only", cls: "bg-pink-50 border-pink-200" },
                  { status: "vip", label: "VIP", cls: "bg-amber-50 border-amber-200" },
                  { status: "disabled", label: "Disabled", cls: "bg-blue-50 border-blue-200" },
                ].map((item) => (
                  <div key={item.status} className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className={`w-5 h-4 rounded-md ${item.cls} border`} />
                    {item.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vehicle</span>
                  <span className="text-zinc-900 font-medium">{data.vehicleName || "Sworgadwari Travels"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Route</span>
                  <span className="text-zinc-900 font-medium">{data.fromCity || "Kathmandu"} → {data.toCity || "Pokhara"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Date</span>
                  <div className="text-right">
                    <span className="text-zinc-900 font-medium text-sm">{data.journeyDate || "Today"}</span>
                    {data.journeyDate && (
                      <div className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                        <Calendar className="h-3 w-3" />
                        {toNepaliDate(data.journeyDate)} BS
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Time</span>
                  <span className="text-zinc-900 font-medium">{data.departureTime || "06:00 AM"}</span>
                </div>
              </div>

              <hr className="border-zinc-100" />

              {selectedSeats.length > 0 ? (
                <div>
                  <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-2">Selected Seats</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-xl bg-violet-100 text-violet-700 px-3 py-1.5 text-sm font-semibold">
                        <ArmchairIcon className="h-3 w-3" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-4">Tap a seat to select it</p>
              )}

              <hr className="border-zinc-100" />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Seats ({selectedSeats.length})</span>
                  <span className="text-zinc-900">{formatPrice(pricePerSeat * selectedSeats.length)}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Service Fee</span>
                  <span className="text-zinc-900">{formatPrice(selectedSeats.length > 0 ? 50 : 0)}</span>
                </div>
                <hr className="border-zinc-100" />
                <div className="flex justify-between font-bold text-base">
                  <span className="text-zinc-900">Total</span>
                  <span className="text-violet-600">{formatPrice(pricePerSeat * selectedSeats.length + (selectedSeats.length > 0 ? 50 : 0))}</span>
                </div>
              </div>

              <Link href={selectedSeats.length > 0 ? "/booking/passenger-details" : "#"} onClick={handleContinue}>
                <Button size="lg" className="w-full mt-2 font-semibold" disabled={selectedSeats.length === 0}>
                  Continue → Passenger Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
