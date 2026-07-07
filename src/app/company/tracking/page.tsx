"use client"

import { useState, useEffect } from "react"
import { MapPin, Navigation, Gauge, Circle, Wifi } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { MapProvider } from "@/components/maps/map-provider"
import { LiveMap } from "@/components/maps/live-map"
import type { VehicleData } from "@/components/maps/types"

const mockVehicles: VehicleData[] = [
  { id: "1", vehicleNumber: "Ba 1 Kha 1234", driverName: "Ram Sharma", latitude: 27.6833, longitude: 85.3183, speed: 56, heading: 280, status: "running", route: "Kathmandu → Pokhara", eta: "2 hrs", battery: 85 },
  { id: "2", vehicleNumber: "Ba 1 Kha 5678", driverName: "Sita KC", latitude: 27.85, longitude: 84.75, speed: 48, heading: 90, status: "running", route: "Pokhara → Kathmandu", eta: "3 hrs", battery: 72 },
  { id: "3", vehicleNumber: "Ba 1 Kha 9012", driverName: "Hari Poudel", latitude: 26.4833, longitude: 87.2833, speed: 0, heading: 0, status: "arrived", route: "Kathmandu → Biratnagar", eta: "Arrived", battery: 45 },
  { id: "4", vehicleNumber: "Ba 1 Kha 3456", driverName: "Gopal Rai", latitude: 27.7172, longitude: 85.324, speed: 0, heading: 0, status: "waiting", route: "Kathmandu → Kakarbhitta", eta: "4 hrs", battery: 100 },
]

interface VehicleTrack {
  id: number
  vehicleNumber: string
  driver: string
  speed: number
  status: string
  location: string
  lat: number
  lng: number
  lastUpdated: string
}

const statusIcon = (status: string) => {
  switch (status) {
    case "active":
    case "moving":
      return <Circle className="h-3 w-3 text-green-600 fill-green-400" />
    case "idle":
      return <Circle className="h-3 w-3 text-yellow-600 fill-yellow-400" />
    case "stopped":
      return <Circle className="h-3 w-3 text-zinc-500 fill-zinc-400" />
    default:
      return <Circle className="h-3 w-3 text-zinc-600 fill-zinc-600" />
  }
}

function toVehicleData(v: VehicleTrack): VehicleData {
  return {
    id: String(v.id),
    vehicleNumber: v.vehicleNumber,
    driverName: v.driver,
    latitude: v.lat,
    longitude: v.lng,
    speed: v.speed ?? 0,
    heading: 0,
    status: v.status === "active" || v.status === "moving" ? "running" : v.status === "idle" ? "waiting" : v.status === "stopped" ? "arrived" : "offline",
    route: v.location || "Unknown",
    eta: "-",
    battery: 0,
  }
}

export default function TrackingPage() {
  const [vehicles, setVehicles] = useState<VehicleTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTrack | null>(null)

  const fetchData = async () => {
    try {
      const res = await api.get("/gps/active")
      const raw = res.data.activeVehicles || res.data.vehicles || res.data || []
      const mapped: VehicleTrack[] = (Array.isArray(raw) ? raw : []).map((v: any, i: number) => ({
        id: i,
        vehicleNumber: v.vehicleInfo?.vehicleNumber || v.vehicleNumber || "Unknown",
        driver: v.driverInfo ? `${v.driverInfo.firstName || ""} ${v.driverInfo.lastName || ""}`.trim() || "Unknown" : "Unknown",
        speed: v.speed || 0,
        status: "moving",
        location: `${v.latitude?.toFixed(4) || "?"}, ${v.longitude?.toFixed(4) || "?"}`,
        lat: v.latitude || 27.7172,
        lng: v.longitude || 85.324,
        lastUpdated: v.timestamp || v.createdAt || new Date().toISOString(),
      }))
      setVehicles(mapped)
    } catch {
      toast.error("Failed to load tracking data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <CompanyLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Live Tracking</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <div className="h-8 w-8 text-violet-600 animate-spin border-2 border-current border-t-transparent rounded-full" />
          </div>
        </div>
      </CompanyLayout>
    )
  }

  const liveVehicles: VehicleData[] = vehicles.length > 0
    ? vehicles.map(toVehicleData)
    : mockVehicles

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Live Tracking</h1>
            <p className="text-zinc-500 mt-1">Real-time GPS tracking for your fleet</p>
          </div>
          {vehicles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Wifi className="h-4 w-4 text-green-600" />
              {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} online
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
                    selectedVehicleId={selectedVehicle ? String(selectedVehicle.id) : undefined}
                    onVehicleSelect={(id) => {
                      if (id) {
                        const found = vehicles.find((v) => String(v.id) === id) ?? null
                        setSelectedVehicle(found)
                      } else {
                        setSelectedVehicle(null)
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
            {vehicles.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Navigation className="h-12 w-12 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 mt-4">No active vehicles</p>
                    <p className="text-zinc-600 text-xs mt-1">Vehicles with GPS will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              vehicles.map((v) => (
                <Card
                  key={v.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-zinc-50 ${
                    selectedVehicle?.id === v.id ? "ring-1 ring-violet-500" : ""
                  }`}
                  onClick={() => setSelectedVehicle(v)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {statusIcon(v.status)}
                      <span className="text-sm font-semibold text-zinc-900">{v.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Gauge className="h-3 w-3" />
                      {v.speed ?? 0} km/h
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">{v.driver || "No driver assigned"}</p>
                  <p className="text-xs text-zinc-500 mt-1 truncate">{v.location || "Location unknown"}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-zinc-600 capitalize">{v.status}</span>
                    <span className="text-[10px] text-zinc-600">
                      {v.lastUpdated
                        ? new Date(v.lastUpdated).toLocaleTimeString()
                        : "-"}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </CompanyLayout>
  )
}
