"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Bus, Clock, MapPin, ArrowRight, Star, Users, Wifi, Tv, Snowflake, Shield, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatPrice } from "@/lib/utils"
import { toNepaliDate } from "@/lib/nepali-date"

const mockResults = [
  {
    id: 1,
    name: "Sworgadwari Travels",
    type: "AC Bus",
    route: "Kathmandu → Pokhara",
    departure: "06:00 AM",
    arrival: "11:00 AM",
    duration: "5 hrs",
    price: 1200,
    seats: 32,
    amenities: ["WiFi", "AC", "Charging", "Blanket"],
    rating: 4.5,
    reviews: 234,
    layout: "2x2",
  },
  {
    id: 2,
    name: "Pathao Travels",
    type: "Deluxe Bus",
    route: "Kathmandu → Pokhara",
    departure: "07:30 AM",
    arrival: "12:30 PM",
    duration: "5 hrs",
    price: 1000,
    seats: 28,
    amenities: ["AC", "Charging"],
    rating: 4.2,
    reviews: 189,
    layout: "2x2",
  },
  {
    id: 3,
    name: "Nepal Yatayat",
    type: "Tourist Bus",
    route: "Kathmandu → Pokhara",
    departure: "09:00 AM",
    arrival: "02:00 PM",
    duration: "5 hrs",
    price: 1500,
    seats: 40,
    amenities: ["WiFi", "AC", "Charging", "Snacks", "Blanket"],
    rating: 4.7,
    reviews: 312,
    layout: "luxury",
  },
  {
    id: 4,
    name: "Sajha Yatayat",
    type: "Night Bus",
    route: "Kathmandu → Pokhara",
    departure: "10:00 PM",
    arrival: "03:00 AM",
    duration: "5 hrs",
    price: 800,
    seats: 12,
    amenities: ["AC", "Blanket"],
    rating: 3.9,
    reviews: 98,
    layout: "sleeper",
  },
]

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-3.5 w-3.5" />,
  AC: <Snowflake className="h-3.5 w-3.5" />,
  Charging: <Tv className="h-3.5 w-3.5" />,
  Blanket: <Shield className="h-3.5 w-3.5" />,
  Snacks: <Star className="h-3.5 w-3.5" />,
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  )
}

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || "Kathmandu"
  const to = searchParams.get("to") || "Pokhara"
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const [sortBy, setSortBy] = useState<"price" | "departure" | "rating">("departure")

  const sorted = [...mockResults].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price
    if (sortBy === "rating") return b.rating - a.rating
    return a.departure.localeCompare(b.departure)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Summary Bar */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100">
              <MapPin className="h-4 w-4 text-violet-600" />
            </div>
            <span className="text-zinc-900 font-semibold">{from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-900 font-semibold">{to}</span>
          </div>
          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4 text-violet-500" />
            <span className="text-zinc-600">
              {new Date(date).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-violet-600 text-xs font-semibold bg-violet-50 px-1.5 py-0.5 rounded">{toNepaliDate(date)} BS</span>
          </div>
          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
          <span className="text-sm text-zinc-500">{sorted.length} vehicles found</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">Sort:</span>
            {(["departure", "price", "rating"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full font-medium transition-colors",
                  sortBy === s ? "bg-violet-600 text-white" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {sorted.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg hover:shadow-violet-600/10 hover:border-violet-300 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-violet-100 shrink-0">
                  <Bus className="h-8 w-8 text-violet-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <h3 className="font-semibold text-zinc-900 text-lg">{vehicle.name}</h3>
                    <span className="text-xs text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full inline-block w-fit font-medium">{vehicle.type}</span>
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span className="font-semibold">{vehicle.rating}</span>
                      <span className="text-zinc-400">({vehicle.reviews})</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-zinc-400" />
                      <span className="text-zinc-900 font-semibold">{vehicle.departure}</span>
                      <ArrowRight className="h-3 w-3 text-zinc-400" />
                      <span className="text-zinc-900 font-semibold">{vehicle.arrival}</span>
                    </div>
                    <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full">{vehicle.duration}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {vehicle.amenities.map((a) => (
                      <span key={a} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 font-medium">
                        {amenityIcons[a]}
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                    <Users className="h-3 w-3" />
                    <span>{vehicle.seats} seats available</span>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-zinc-900">{formatPrice(vehicle.price)}</p>
                    <p className="text-xs text-zinc-400">per seat</p>
                  </div>
                  <Link href={`/booking/select-seat?id=${vehicle.id}`}>
                    <Button size="sm" className="font-semibold">
                      Select Seat
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
