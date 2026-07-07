"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Printer, Eye, Ticket } from "lucide-react"
import { toast } from "sonner"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CounterLayout } from "@/components/counter/counter-layout"
import api from "@/lib/api"

const mockResults = [
  { id: 1, bookingId: "SAB-001", passenger: "Ram Sharma", phone: "9841234567", route: "Kathmandu → Pokhara", date: "2025-07-03", status: "confirmed", amount: 1200 },
  { id: 2, bookingId: "SAB-002", passenger: "Sita Pandey", phone: "9859876543", route: "Kathmandu → Chitwan", date: "2025-07-03", status: "confirmed", amount: 800 },
  { id: 3, bookingId: "SAB-003", passenger: "Hari Adhikari", phone: "9865552221", route: "Pokhara → Kathmandu", date: "2025-07-04", status: "pending", amount: 2400 },
]

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await api.get("/counter/passengers/search", { params: { q: query } })
      setResults(res.data)
    } catch {
      const filtered = mockResults.filter(r =>
        r.bookingId.toLowerCase().includes(query.toLowerCase()) ||
        r.passenger.toLowerCase().includes(query.toLowerCase()) ||
        r.phone.includes(query)
      )
      setResults(filtered)
      if (filtered.length === 0) toast.error("No bookings found")
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
          <h1 className="text-2xl font-bold text-zinc-900">Search Bookings</h1>
          <p className="text-zinc-500 mt-1">Find bookings by booking ID, passenger name, or phone</p>
        </div>

        <div className="flex gap-3 max-w-xl">
          <div className="flex-1">
            <Input
              placeholder="Booking ID, Name, or Phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button onClick={handleSearch} loading={loading}>
            <Search className="h-4 w-4" />
            Search
          </Button>
        </div>

        {searched && (
          <>
            {results.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 mt-4">No results found</p>
                    <p className="text-zinc-600 text-sm mt-1">Try a different search term</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {results.map((booking) => (
                  <Card key={booking.id} className="p-4 hover:bg-zinc-100/30 transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-violet-600 font-medium">
                          #{booking.bookingId || `#${booking.id}`}
                        </span>
                        {statusBadge(booking.status)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{booking.passenger || booking.customerName || "Unknown"}</p>
                        <p className="text-xs text-zinc-500">{booking.phone || "-"}</p>
                      </div>
                      <div className="text-xs text-zinc-500 space-y-1">
                        <p>{booking.route || booking.routeName || "-"}</p>
                        <p>{booking.date ? new Date(booking.date).toLocaleDateString() : "-"}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                        <span className="text-sm font-semibold text-zinc-200">
                          Rs. {(booking.amount ?? booking.totalAmount ?? 0).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href={`/counter/ticket?bookingId=${booking.bookingId || booking.id}`}
                          >
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </CounterLayout>
  )
}
