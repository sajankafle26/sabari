"use client"

import { useState, useEffect } from "react"
import { Users, Building2, Bus, Route, CalendarDays, IndianRupee, TrendingUp, MapPin, Settings, Database, CreditCard, MessageSquare, Activity, Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/admin/admin-layout"
import { MapProvider } from "@/components/maps/map-provider"
import { LiveMap } from "@/components/maps/live-map"
import type { VehicleData } from "@/components/maps/types"
import api from "@/lib/api"
import { todayNepali } from "@/lib/nepali-date"

const vehicles: VehicleData[] = [
  { id: "1", vehicleNumber: "Ba 1 Kha 1234", driverName: "Ram Sharma", latitude: 27.6833, longitude: 85.3183, speed: 56, heading: 280, status: "running", route: "Kathmandu → Pokhara", eta: "2 hrs", battery: 85 },
  { id: "2", vehicleNumber: "Ba 1 Kha 5678", driverName: "Sita KC", latitude: 27.85, longitude: 84.75, speed: 48, heading: 90, status: "running", route: "Pokhara → Kathmandu", eta: "3 hrs", battery: 72 },
  { id: "3", vehicleNumber: "Ba 1 Kha 9012", driverName: "Hari Poudel", latitude: 26.4833, longitude: 87.2833, speed: 0, heading: 0, status: "arrived", route: "Kathmandu → Biratnagar", eta: "Arrived", battery: 45 },
  { id: "4", vehicleNumber: "Ba 1 Kha 3456", driverName: "Gopal Rai", latitude: 27.7172, longitude: 85.324, speed: 0, heading: 0, status: "waiting", route: "Kathmandu → Kakarbhitta", eta: "4 hrs", battery: 100 },
]

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/admin/dashboard").then((res) => setStats(res.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: "Companies", value: stats?.companies ?? 0, icon: Building2, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Users", value: stats?.users ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-600/10" },
    { label: "Vehicles", value: stats?.vehicles ?? 0, icon: Bus, color: "text-cyan-600", bg: "bg-cyan-600/10" },
    { label: "Routes", value: stats?.routes ?? 0, icon: Route, color: "text-emerald-400", bg: "bg-emerald-600/10" },
    { label: "Revenue Today", value: `Rs. ${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-600/10" },
    { label: "Bookings Today", value: stats?.todayBookings ?? 0, icon: CalendarDays, color: "text-rose-400", bg: "bg-rose-600/10" },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Super Admin</h1>
            <p className="text-zinc-500 mt-1">Full control over the Sabari platform</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-zinc-200 rounded-lg px-4 py-2">
            <Calendar className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-zinc-500">
              <span className="text-zinc-200 font-medium">{todayNepali()}</span>
            </span>
          </div>
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4" />
            Backup
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className={`p-2 rounded-lg ${stat.bg} inline-flex`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-lg font-bold text-zinc-900 mt-3">{loading ? "..." : stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-violet-600" />
              Live Vehicle Map
            </CardTitle>
            <CardDescription>All running vehicles across Nepal</CardDescription>
          </CardHeader>
          <CardContent>
            <MapProvider>
              <LiveMap vehicles={vehicles} height="h-80" showLegend />
            </MapProvider>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
