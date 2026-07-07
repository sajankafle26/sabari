"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation, Gauge, Circle, Wifi, Bus, Clock, User } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CounterLayout } from "@/components/counter/counter-layout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapProvider } from "@/components/maps/map-provider"
import { LiveMap } from "@/components/maps/live-map"
import type { VehicleData } from "@/components/maps/types"

interface TripTrack {
  id: number
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

const mockTrips: TripTrack[] = [
  { id: 1, vehicleNumber: "BA 1 KHA 1234", vehicleName: "Sworgadwari Travels", driver: "Ram Thapa", route: "Kathmandu → Pokhara", speed: 65, eta: "1h 30m", status: "moving", location: "Mugling", lat: 27.85, lng: 84.55, lastUpdated: new Date().toISOString() },
  { id: 2, vehicleNumber: "BA 1 KHA 5678", vehicleName: "Pathao Travels", driver: "Sita Gurung", route: "Pokhara → Kathmandu", speed: 0, eta: "3h 15m", status: "stopped", location: "Pokhara Bus Park", lat: 28.21, lng: 83.98, lastUpdated: new Date().toISOString() },
  { id: 3, vehicleNumber: "BA 1 KHA 9012", vehicleName: "Nepal Yatayat", driver: "Hari KC", route: "Kathmandu → Chitwan", speed: 45, eta: "2h 00m", status: "moving", location: "Naubise", lat: 27.7, lng: 85.15, lastUpdated: new Date().toISOString() },
]

function tripToVehicleData(trip: TripTrack): VehicleData {
  return {
    id: String(trip.id),
    vehicleNumber: trip.vehicleNumber,
    driverName: trip.driver,
    latitude: trip.lat,
    longitude: trip.lng,
    speed: trip.speed ?? 0,
    heading: 0,
    status: trip.status === "moving" || trip.status === "active" ? "running" : trip.status === "idle" ? "waiting" : trip.status === "stopped" ? "arrived" : "offline",
    route: trip.route,
    eta: trip.eta || "-",
    battery: 0,
  }
}

const statusIcon = (status: string) => {
  switch (status) {
    case "moving":
    case "active":
      return <Circle className="h-3 w-3 text-green-600 fill-green-400" />
    case "idle":
      return <Circle className="h-3 w-3 text-yellow-600 fill-yellow-400" />
    case "stopped":
      return <Circle className="h-3 w-3 text-zinc-500 fill-zinc-400" />
    default:
      return <Circle className="h-3 w-3 text-zinc-600 fill-zinc-600" />
  }
}

export default function TrackingPage() {
  const [trips, setTrips] = useState<TripTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrip, setSelectedTrip] = useState<TripTrack | null>(null)

  const fetchData = async () => {
    try {
      const res = await api.get("/counter/trips/active")
      setTrips(res.data)
    } catch {
      setTrips(mockTrips)
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
      <CounterLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Live Tracking</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <div className="h-8 w-8 text-violet-600 animate-spin border-2 border-current border-t-transparent rounded-full" />
          </div>
        </div>
      </CounterLayout>
    )
  }

  return (
    <CounterLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Live Tracking</h1>
            <p className="text-zinc-500 mt-1">Real-time trip tracking for counter operations</p>
          </div>
          {trips.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Wifi className="h-4 w-4 text-green-600" />
              {trips.length} active trip{trips.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[500px]">
              <CardContent className="p-0 h-full">
                <MapProvider>
                  <LiveMap
                    vehicles={liveVehicles}
                    selectedVehicleId={selectedTrip ? String(selectedTrip.id) : undefined}
                    onVehicleSelect={(id) => {
                      if (id) {
                        const found = trips.find((t) => String(t.id) === id) ?? null
                        setSelectedTrip(found)
                      } else {
                        setSelectedTrip(null)
                      }
                    }}
                    height="h-full"
                    showLegend
                  />
                </MapProvider>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {trips.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Navigation className="h-12 w-12 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 mt-4">No active trips</p>
                    <p className="text-zinc-600 text-xs mt-1">Trips with GPS will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              trips.map((trip) => (
                <Card
                  key={trip.id}
                  className={`p-4 cursor-pointer transition-all hover:bg-zinc-50 ${
                    selectedTrip?.id === trip.id ? "ring-1 ring-violet-500" : ""
                  }`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {statusIcon(trip.status)}
                      <span className="text-sm font-semibold text-zinc-900">{trip.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Gauge className="h-3 w-3" />
                      {trip.speed ?? 0} km/h
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                      <Bus className="h-3 w-3 shrink-0" />
                      {trip.vehicleName}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {trip.route}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 shrink-0" />
                      {trip.driver || "No driver"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 shrink-0" />
                      ETA: {trip.eta || "-"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-200/50">
                    <span className="text-[10px] capitalize text-zinc-600">{trip.status}</span>
                    <span className="text-[10px] text-zinc-600">
                      {trip.location || "Unknown"}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </CounterLayout>
  )
}
