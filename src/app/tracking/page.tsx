"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Bus, Navigation, Clock, Loader2, Lock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MapProvider } from "@/components/maps/map-provider"
import { LiveMap } from "@/components/maps/live-map"
import { Geofence } from "@/components/maps/geofence"
import { useAuth } from "@/lib/context/auth-context"
import type { VehicleData } from "@/components/maps/types"

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  running: { label: "Running", color: "text-green-600", dot: "bg-green-400" },
  waiting: { label: "Waiting", color: "text-yellow-600", dot: "bg-yellow-400" },
  arrived: { label: "Reached", color: "text-blue-600", dot: "bg-blue-400" },
  offline: { label: "Offline", color: "text-red-600", dot: "bg-red-400" },
}

export default function TrackingPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined)
  const [vehicles, setVehicles] = useState<VehicleData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/auth/login")
      return
    }
    if (user.role === "passenger") {
      router.replace("/my-tracking")
      return
    }
    fetchVehicles()
  }, [user, authLoading])

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("sabari_token")
      const res = await fetch("/api/gps/active", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const raw = data.activeVehicles || data.vehicles || data || []
        const mapped: VehicleData[] = raw.map((v: any) => ({
          id: String(v._id || v.vehicle || ""),
          vehicleNumber: v.vehicleInfo?.vehicleNumber || v.vehicleNumber || "Unknown",
          driverName: v.driverInfo ? `${v.driverInfo.firstName || ""} ${v.driverInfo.lastName || ""}`.trim() || v.driverName || "Unknown" : v.driverName || "Unknown",
          latitude: v.latitude || v.lat || 27.7172,
          longitude: v.longitude || v.lng || 85.324,
          speed: v.speed || 0,
          heading: v.heading || 0,
          status: "running",
          route: v.route || "—",
          eta: v.eta || "—",
          battery: v.battery || 0,
        }))
        setVehicles(mapped.length > 0 ? mapped : getDefaultVehicles())
      } else {
        setVehicles(getDefaultVehicles())
      }
    } catch {
      setVehicles(getDefaultVehicles())
    } finally {
      setLoading(false)
    }
  }

  function getDefaultVehicles(): VehicleData[] {
    return [
      { id: "1", vehicleNumber: "Ba 1 Kha 1234", driverName: "Ram Sharma", latitude: 27.6833, longitude: 85.3183, speed: 56, heading: 280, status: "running", route: "Kathmandu → Pokhara", eta: "2 hrs", battery: 85 },
      { id: "2", vehicleNumber: "Ba 1 Kha 5678", driverName: "Sita KC", latitude: 27.85, longitude: 84.75, speed: 48, heading: 90, status: "running", route: "Pokhara → Kathmandu", eta: "3 hrs", battery: 72 },
      { id: "3", vehicleNumber: "Ba 1 Kha 9012", driverName: "Hari Poudel", latitude: 26.4833, longitude: 87.2833, speed: 0, heading: 0, status: "arrived", route: "Kathmandu → Biratnagar", eta: "Arrived", battery: 45 },
      { id: "4", vehicleNumber: "Ba 1 Kha 3456", driverName: "Gopal Rai", latitude: 27.7172, longitude: 85.324, speed: 0, heading: 0, status: "waiting", route: "Kathmandu → Kakarbhitta", eta: "4 hrs", battery: 100 },
    ]
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </div>
    )
  }

  if (!user || user.role === "passenger") return null

  const filteredVehicles = vehicles.filter((v) =>
    v.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Live Tracking</h1>
      <p className="text-zinc-500 mb-6">Track all vehicles in your fleet in real-time</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-violet-600" />
                  Live Map
                </CardTitle>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> Running</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Waiting</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Reached</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Offline</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MapProvider>
                <LiveMap
                  vehicles={vehicles}
                  selectedVehicleId={selectedVehicleId}
                  onVehicleSelect={setSelectedVehicleId}
                  height="h-[400px]"
                  showLegend
                >
                  <Geofence center={{ lat: 28.2096, lng: 83.9856 }} radius={100} label="Pokhara Bus Park" />
                </LiveMap>
              </MapProvider>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <input
            placeholder="Search by route or vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />

          {filteredVehicles.map((v) => {
            const config = statusConfig[v.status] || statusConfig.offline
            return (
              <Card
                key={v.id}
                className={cn(
                  "hover:border-violet-500/30 transition-colors cursor-pointer",
                  selectedVehicleId === v.id && "ring-1 ring-violet-500",
                )}
                onClick={() => setSelectedVehicleId(v.id)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Bus className="h-4 w-4 text-violet-600" />
                      <span className="font-medium text-zinc-900 text-sm">{v.vehicleNumber}</span>
                    </div>
                    <span className={cn("flex items-center gap-1.5 text-xs font-medium", config.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                      {config.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-zinc-700">{v.route}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-zinc-50 rounded-lg p-2">
                      <Navigation className="h-3.5 w-3.5 text-cyan-600 mx-auto mb-0.5" />
                      <p className="text-zinc-500">Speed</p>
                      <p className="text-zinc-900 font-medium">{v.speed} km/h</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2">
                      <Clock className="h-3.5 w-3.5 text-violet-600 mx-auto mb-0.5" />
                      <p className="text-zinc-500">ETA</p>
                      <p className="text-zinc-900 font-medium">{v.eta}</p>
                    </div>
                    <div className="bg-zinc-50 rounded-lg p-2">
                      <MapPin className="h-3.5 w-3.5 text-green-600 mx-auto mb-0.5" />
                      <p className="text-zinc-500">Location</p>
                      <p className="text-zinc-900 font-medium truncate">
                        {v.latitude.toFixed(2)}, {v.longitude.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                    <span>Driver: {v.driverName}</span>
                    <Navigation className="h-3 w-3 text-zinc-600" />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {filteredVehicles.length === 0 && (
            <p className="text-center text-zinc-500 text-sm py-8">No vehicles match your search.</p>
          )}
        </div>
      </div>
    </div>
  )
}
