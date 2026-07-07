"use client"

import { Bus, Users, CalendarDays, IndianRupee, MapPin, Clock, TrendingUp, AlertTriangle, Fuel } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const stats = [
  { label: "Total Vehicles", value: "48", change: "+2", icon: Bus, color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Running Vehicles", value: "23", change: "Live", icon: MapPin, color: "text-green-600", bg: "bg-green-600/10" },
  { label: "Today's Trips", value: "156", change: "+12", icon: CalendarDays, color: "text-cyan-600", bg: "bg-cyan-600/10" },
  { label: "Today's Passengers", value: "3,240", change: "+18%", icon: Users, color: "text-blue-600", bg: "bg-blue-600/10" },
  { label: "Today's Revenue", value: "Rs. 5,82,000", change: "+22%", icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-600/10" },
  { label: "Active Drivers", value: "42", change: "Online", icon: Users, color: "text-orange-400", bg: "bg-orange-600/10" },
]

const recentTrips = [
  { route: "Kathmandu → Pokhara", vehicle: "Ba 1 Kha 1234", driver: "Ram Sharma", status: "Running", time: "07:00 AM", eta: "2.5 hrs" },
  { route: "Pokhara → Kathmandu", vehicle: "Ba 1 Kha 5678", driver: "Sita KC", status: "Running", time: "08:30 AM", eta: "3 hrs" },
  { route: "Kathmandu → Biratnagar", vehicle: "Ba 1 Kha 9012", driver: "Hari Poudel", status: "Completed", time: "06:00 AM", eta: "-" },
  { route: "Kathmandu → Kakarbhitta", vehicle: "Ba 1 Kha 3456", driver: "Gopal Rai", status: "Delayed", time: "09:00 AM", eta: "4 hrs" },
  { route: "Kathmandu → Lumbini", vehicle: "Ba 1 Kha 7890", driver: "Krishna Thapa", status: "Scheduled", time: "11:00 AM", eta: "-" },
]

const statusColors: Record<string, string> = {
  Running: "text-green-600 bg-green-600/10",
  Completed: "text-blue-600 bg-blue-600/10",
  Delayed: "text-red-600 bg-red-600/10",
  Scheduled: "text-zinc-500 bg-zinc-600/10",
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Welcome back, Admin — here&apos;s your overview for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className={`text-xs font-medium ${stat.change === "Live" ? "text-green-600" : stat.color}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-zinc-900 mt-3">{stat.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Live Map Placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Live Vehicle Tracking</CardTitle>
            <p className="text-sm text-zinc-500 mt-0.5">All running vehicles on the map</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> Running</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Waiting</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" /> Offline</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /> Reached</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 rounded-xl bg-white flex items-center justify-center border border-zinc-200">
            <div className="text-center">
              <MapPin className="h-10 w-10 text-zinc-700 mx-auto" />
              <p className="text-zinc-500 text-sm mt-2">Google Maps will render here</p>
              <p className="text-zinc-600 text-xs mt-1">23 vehicles currently running</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trips */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Trips</CardTitle>
          <p className="text-sm text-zinc-500 mt-0.5">Recent and upcoming trips</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-200">
                  <th className="text-left py-3 px-2 font-medium">Route</th>
                  <th className="text-left py-3 px-2 font-medium">Vehicle</th>
                  <th className="text-left py-3 px-2 font-medium">Driver</th>
                  <th className="text-left py-3 px-2 font-medium">Time</th>
                  <th className="text-left py-3 px-2 font-medium">ETA</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip, i) => (
                  <tr key={i} className="border-b border-zinc-200/50 text-zinc-700 hover:bg-zinc-100/30">
                    <td className="py-3 px-2">{trip.route}</td>
                    <td className="py-3 px-2 text-zinc-500">{trip.vehicle}</td>
                    <td className="py-3 px-2">{trip.driver}</td>
                    <td className="py-3 px-2 text-zinc-500">{trip.time}</td>
                    <td className="py-3 px-2 text-zinc-500">{trip.eta}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[trip.status]}`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
