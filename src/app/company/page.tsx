"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bus, Users, CalendarDays, IndianRupee, Ticket, Activity, Car, Route, MapPin, BarChart, Gauge, Clock, Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CompanyLayout } from "@/components/company/company-layout"
import api from "@/lib/api"
import { todayNepali } from "@/lib/nepali-date"

export default function CompanyDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/company/dashboard").catch(() => ({ data: {} })),
      api.get("/bookings?limit=5").catch(() => ({ data: [] })),
    ]).then(([statsRes, bookingsRes]) => {
      setStats(statsRes.data)
      setRecentBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : [])
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: "Total Vehicles", value: stats?.totalVehicles ?? 0, icon: Bus, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Active Vehicles", value: stats?.activeVehicles ?? 0, icon: Activity, color: "text-green-600", bg: "bg-green-600/10" },
    { label: "Total Drivers", value: stats?.totalDrivers ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-600/10" },
    { label: "Today's Schedules", value: stats?.todaySchedules ?? 0, icon: CalendarDays, color: "text-cyan-600", bg: "bg-cyan-600/10" },
    { label: "Today's Bookings", value: stats?.todayBookings ?? 0, icon: Ticket, color: "text-amber-600", bg: "bg-amber-600/10" },
    { label: "Today's Revenue", value: `Rs. ${(stats?.todayRevenue ?? 0).toLocaleString()}`, icon: IndianRupee, color: "text-rose-400", bg: "bg-rose-600/10" },
  ]

  const quickActions = [
    { label: "Manage Vehicles", href: "/company/vehicles", icon: Car, desc: "Add and manage your fleet" },
    { label: "Vehicle Health", href: "/company/vehicle-health", icon: Gauge, desc: "Fuel, service, and expiry tracking" },
    { label: "Attendance", href: "/company/attendance", icon: Clock, desc: "Staff clock-in/out records" },
    { label: "Manage Drivers", href: "/company/drivers", icon: Users, desc: "Manage driver profiles" },
    { label: "View Schedules", href: "/company/schedules", icon: CalendarDays, desc: "View and create schedules" },
    { label: "Live Tracking", href: "/company/tracking", icon: MapPin, desc: "Track your vehicles live" },
    { label: "Reports", href: "/company/reports", icon: BarChart, desc: "View revenue and analytics" },
    { label: "Manage Routes", href: "/company/routes", icon: Route, desc: "Browse available routes" },
  ]

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "text-green-600 bg-green-600/10",
      pending: "text-yellow-600 bg-yellow-600/10",
      cancelled: "text-red-600 bg-red-600/10",
      completed: "text-blue-600 bg-blue-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Company Dashboard</h1>
            <p className="text-zinc-500 mt-1">Overview of your transport business</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-zinc-200 rounded-lg px-4 py-2">
            <Calendar className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-zinc-500">
              <span className="text-zinc-200 font-medium">{todayNepali()}</span>
            </span>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-violet-600" />
                Recent Bookings
              </CardTitle>
              <CardDescription>Latest 5 bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">No recent bookings</p>
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-zinc-200/50 last:border-0">
                      <div>
                        <p className="text-sm text-zinc-200 font-medium">#{b.bookingId || b.id}</p>
                        <p className="text-xs text-zinc-500">{b.route || b.routeName || "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-200">Rs. {b.totalAmount?.toLocaleString?.() ?? b.totalAmount ?? 0}</p>
                        <div className="mt-0.5">{statusBadge(b.status)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Frequently used pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className="p-3 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer">
                      <action.icon className="h-4 w-4 text-violet-600" />
                      <p className="text-sm text-zinc-200 font-medium mt-2">{action.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CompanyLayout>
  )
}
