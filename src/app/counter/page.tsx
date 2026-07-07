"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { LayoutDashboard, Ticket, IndianRupee, CreditCard, Activity, Search, PlusCircle, Calendar } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CounterLayout } from "@/components/counter/counter-layout"
import api from "@/lib/api"
import { todayNepali, toNepaliDate } from "@/lib/nepali-date"

const mockRecentBookings = [
  { id: 1, bookingId: "SAB-001", passenger: "Ram Sharma", route: "Kathmandu → Pokhara", amount: 1200, status: "confirmed", date: "2025-07-03" },
  { id: 2, bookingId: "SAB-002", passenger: "Sita Pandey", route: "Kathmandu → Chitwan", amount: 800, status: "confirmed", date: "2025-07-03" },
  { id: 3, bookingId: "SAB-003", passenger: "Hari Adhikari", route: "Pokhara → Kathmandu", amount: 1200, status: "pending", date: "2025-07-03" },
  { id: 4, bookingId: "SAB-004", passenger: "Gita Thapa", route: "Kathmandu → Pokhara", amount: 2400, status: "confirmed", date: "2025-07-02" },
  { id: 5, bookingId: "SAB-005", passenger: "Krishna Rai", route: "Biratnagar → Kathmandu", amount: 1400, status: "cancelled", date: "2025-07-02" },
]

export default function CounterDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/counter/dashboard").catch(() => ({
        data: { todayBookings: 12, cashCollected: 8400, onlinePayments: 6200, totalTransactions: 18 }
      })),
      api.get("/counter/bookings/recent").catch(() => ({ data: mockRecentBookings })),
    ]).then(([statsRes, bookingsRes]) => {
      setStats(statsRes.data)
      setRecentBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : mockRecentBookings)
    }).finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: "Today's Bookings", value: stats?.todayBookings ?? 12, icon: Ticket, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Cash Collected", value: `Rs. ${(stats?.cashCollected ?? 8400).toLocaleString()}`, icon: IndianRupee, color: "text-green-600", bg: "bg-green-600/10" },
    { label: "Online Payments", value: `Rs. ${(stats?.onlinePayments ?? 6200).toLocaleString()}`, icon: CreditCard, color: "text-blue-600", bg: "bg-blue-600/10" },
    { label: "Total Transactions", value: stats?.totalTransactions ?? 18, icon: Activity, color: "text-amber-600", bg: "bg-amber-600/10" },
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
    <CounterLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Counter Dashboard</h1>
            <p className="text-zinc-500 mt-1">Manage bookings and counter operations</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/80 border border-zinc-200 rounded-lg px-4 py-2">
            <Calendar className="h-4 w-4 text-violet-600" />
            <span className="text-sm text-zinc-500">
              <span className="text-zinc-200 font-medium">{todayNepali()}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Activity className="h-5 w-5 text-violet-600" />
                Recent Bookings
              </CardTitle>
              <CardDescription>Latest 5 bookings at this counter</CardDescription>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <p className="text-zinc-500 text-sm py-4 text-center">No recent bookings</p>
              ) : (
                <div className="space-y-2">
                  {recentBookings.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-zinc-200/50 last:border-0">
                      <div>
                        <p className="text-sm text-zinc-200 font-medium">#{b.bookingId || b.id}</p>
                        <p className="text-xs text-zinc-500">{b.passenger || b.customerName || "-"}</p>
                        <p className="text-xs text-zinc-500">{b.route || b.routeName || "-"}</p>
                        {b.date && <p className="text-[10px] text-violet-600">{toNepaliDate(b.date)} BS</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-200">Rs. {(b.amount ?? b.totalAmount ?? 0).toLocaleString()}</p>
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
                <LayoutDashboard className="h-5 w-5 text-violet-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Frequently used operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/counter/book">
                  <div className="p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer">
                    <PlusCircle className="h-5 w-5 text-violet-600" />
                    <p className="text-sm text-zinc-200 font-medium mt-2">New Booking</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Create a new ticket</p>
                  </div>
                </Link>
                <Link href="/counter/search">
                  <div className="p-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer">
                    <Search className="h-5 w-5 text-violet-600" />
                    <p className="text-sm text-zinc-200 font-medium mt-2">Search Passenger</p>
                    <p className="text-xs text-zinc-500 mt-0.5">Find existing bookings</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CounterLayout>
  )
}
