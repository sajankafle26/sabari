"use client"

import { useState, useEffect } from "react"
import { MapPin, Bus, Navigation, Clock, User, Circle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { MapProvider } from "@/components/maps/map-provider"
import { LiveMap } from "@/components/maps/live-map"
import type { VehicleData } from "@/components/maps/types"

interface TripTrack {
  id: string
  vehicleNumber: string
  vehicleName: string
  driver: string
  route: string
  speed: number
  eta: string
  status: string
  location: string
  lat: number
  lng: number
  lastUpdated: string
}

function tripToVehicleData(trip: TripTrack): VehicleData {
  return {
    id: trip.id,
    vehicleNumber: trip.vehicleNumber,
    driverName: trip.driver,
    latitude: trip.lat,
    longitude: trip.lng,
    speed: trip.speed ?? 0,
    heading: 0,
    status: trip.status === "moving" || trip.status === "running" ? "running" : trip.status === "scheduled" ? "waiting" : "offline",
    route: trip.route,
    eta: trip.eta || "-",
    battery: 0,
  }
}

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  moving: { label: "Running", color: "text-green-600", dot: "bg-green-400" },
  scheduled: { label: "Scheduled", color: "text-yellow-600", dot: "bg-yellow-400" },
  completed: { label: "Completed", color: "text-blue-600", dot: "bg-blue-400" },
  cancelled: { label: "Cancelled", color: "text-red-600", dot: "bg-red-400" },
}

export default function MyTrackingPage() {
  const [trips, setTrips] = useState<TripTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<TripTrack | null>(null)

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("sabari_token")
      if (!token) { setLoading(false); return }
      const res = await fetch("/api/my-tracking", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setTrips(data)
    } catch {
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const liveVehicles: VehicleData[] = trips.map(tripToVehicleData)

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My Tracking</h1>
          <p className="text-zinc-500 mt-1">Real-time location of your booked vehicles</p>
        </div>
        {trips.length > 0 && (
          <span className="text-sm text-zinc-500">{trips.length} active trip{trips.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Bus className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No active trips</p>
              <p className="text-zinc-600 text-sm mt-1">
                Vehicles you booked for today will appear here with live GPS tracking
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <MapProvider>
                <LiveMap
                  vehicles={liveVehicles}
                  selectedVehicleId={selectedTrip?.id}
                  onVehicleSelect={(id) => {
                    if (id) {
                      const found = trips.find((t) => t.id === id) ?? null
                      setSelectedTrip(found)
                    } else {
                      setSelectedTrip(null)
                    }
                  }}
                  height="h-[400px]"
                  showLegend
                />
              </MapProvider>
            </Card>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
            {trips.map((trip) => {
              const config = statusConfig[trip.status] || statusConfig.moving
              return (
                <Card
                  key={trip.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:bg-zinc-50",
                    selectedTrip?.id === trip.id ? "ring-1 ring-violet-500" : ""
                  )}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", config.dot)} />
                      <span className="text-sm font-semibold text-zinc-900">{trip.vehicleNumber}</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Navigation className="h-3 w-3" />
                      {trip.speed ?? 0} km/h
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Bus className="h-3 w-3 shrink-0" />
                      {trip.vehicleName || "Vehicle"}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {trip.route}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 shrink-0" />
                      {trip.driver}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 shrink-0" />
                      ETA: {trip.eta || "-"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-200/50">
                    <span className={cn("text-[10px] font-medium capitalize", config.color)}>{config.label}</span>
                    <span className="text-[10px] text-zinc-600">{trip.location || "N/A"}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
