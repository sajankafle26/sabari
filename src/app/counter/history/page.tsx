"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Phone, Clock, Eye, Printer } from "lucide-react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CounterLayout } from "@/components/counter/counter-layout"
import api from "@/lib/api"

const mockHistory = [
  { id: 1, bookingId: "SAB-001", route: "Kathmandu → Pokhara", date: "2025-07-03", seats: "S12, S13", amount: 2400, status: "confirmed" },
  { id: 2, bookingId: "SAB-006", route: "Kathmandu → Chitwan", date: "2025-06-28", seats: "S5", amount: 800, status: "completed" },
  { id: 3, bookingId: "SAB-012", route: "Pokhara → Kathmandu", date: "2025-06-20", seats: "S8, S9", amount: 2400, status: "completed" },
  { id: 4, bookingId: "SAB-018", route: "Kathmandu → Pokhara", date: "2025-06-15", seats: "S22", amount: 1200, status: "cancelled" },
]

export default function HistoryPage() {
  const [phone, setPhone] = useState("")
  const [bookings, setBookings] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!phone.trim() || phone.trim().length < 7) {
      toast.error("Please enter a valid phone number")
      return
    }
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get(`/counter/bookings/history/${phone}`)
      setBookings(res.data)
    } catch {
      setBookings(mockHistory)
    } finally {
      setLoading(false)
    }
  }

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
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Passenger History</h1>
          <p className="text-zinc-500 mt-1">View all bookings for a passenger by phone number</p>
        </div>

        <div className="flex gap-3 max-w-xl">
          <div className="flex-1">
            <Input
              placeholder="Enter phone number (98XXXXXXXX)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<Phone className="h-4 w-4" />}
            />
          </div>
          <Button onClick={handleSearch} loading={loading}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {searched && (
          <>
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 mt-4">No booking history found</p>
                    <p className="text-zinc-600 text-sm mt-1">This phone number has no past bookings</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl bg-white/80 border border-zinc-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Booking ID</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Route</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Seats</th>
                        <th className="text-right py-3 px-4 text-zinc-500 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 text-zinc-500 font-medium">Status</th>
                        <th className="text-right py-3 px-4 text-zinc-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-zinc-200/50 text-zinc-700 hover:bg-zinc-100/30 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-xs">#{row.bookingId || row.id}</td>
                          <td className="py-3 px-4">{row.route || "-"}</td>
                          <td className="py-3 px-4">{row.date ? new Date(row.date).toLocaleDateString() : "-"}</td>
                          <td className="py-3 px-4">{row.seats || "-"}</td>
                          <td className="py-3 px-4 text-right">Rs. {(row.amount ?? 0).toLocaleString()}</td>
                          <td className="py-3 px-4">{statusBadge(row.status)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/counter/ticket?bookingId=${row.bookingId || row.id}`}>
                                <button className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-zinc-100 transition-colors">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </Link>
                              <button className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-zinc-100 transition-colors">
                                <Printer className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CounterLayout>
  )
}
