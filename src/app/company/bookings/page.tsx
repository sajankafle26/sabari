"use client"

import { useState, useEffect } from "react"
import { Search, X, Calendar, Eye, Ban } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { HorizontalDatePicker } from "@/components/ui/horizontal-date-picker"

interface Booking {
  id: number
  bookingId: string
  route: string
  vehicleNumber: string
  passengers: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  createdAt: string
  customerName: string
  customerPhone: string
}

export default function BookingsPage() {
  const [data, setData] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const fetchData = async () => {
    try {
      const params: any = {}
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo
      const res = await api.get("/bookings", { params })
      const raw = res.data.bookings || []
      const mapped: Booking[] = raw.map((b: any) => ({
        id: b._id,
        bookingId: b.bookingId,
        route: b.route ? `${b.route.from || "?"} → ${b.route.to || "?"}` : "-",
        vehicleNumber: b.vehicle?.vehicleNumber || "-",
        passengers: b.passengers?.length ?? 0,
        totalAmount: b.totalAmount,
        paymentMethod: b.paymentMethod || "-",
        paymentStatus: b.paymentStatus || "pending",
        status: b.bookingStatus || "pending",
        createdAt: b.createdAt,
        customerName: b.passengers?.[0]?.name || "-",
        customerPhone: b.passengers?.[0]?.phone || "-",
      }))
      setData(mapped)
    } catch {
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleFilter = () => fetchData()

  const statusBadge = (status: string, type: "status" | "payment" = "status") => {
    const colors: Record<string, string> = {
      confirmed: "text-green-600 bg-green-600/10",
      pending: "text-yellow-600 bg-yellow-600/10",
      cancelled: "text-red-600 bg-red-600/10",
      completed: "text-blue-600 bg-blue-600/10",
      paid: "text-green-600 bg-green-600/10",
      unpaid: "text-yellow-600 bg-yellow-600/10",
      refunded: "text-purple-600 bg-purple-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const handleCancel = async (booking: Booking) => {
    if (!confirm(`Cancel booking ${booking.bookingId}?`)) return
    try {
      await api.patch(`/bookings/${booking.id}/cancel`)
      toast.success("Booking cancelled")
      setSelectedBooking(null)
      fetchData()
    } catch {
      toast.error("Failed to cancel booking")
    }
  }

  if (loading) {
    return (
      <CompanyLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <div className="h-8 w-8 text-violet-600 animate-spin border-2 border-current border-t-transparent rounded-full" />
          </div>
        </div>
      </CompanyLayout>
    )
  }

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Bookings</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <HorizontalDatePicker value={dateFrom || new Date().toISOString().split("T")[0]} onChange={setDateFrom} />
          <Button size="sm" onClick={handleFilter}>
            <Search className="h-4 w-4" />
            Filter
          </Button>
          {(dateFrom || dateTo) && (
            <Button size="sm" variant="ghost" onClick={() => { setDateFrom(""); setDateTo(""); fetchData() }}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Search className="h-12 w-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 mt-4">No bookings found</p>
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
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Route</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Vehicle</th>
                    <th className="text-center py-3 px-4 text-zinc-500 font-medium">Passengers</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Payment</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Date</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-zinc-200/50 text-zinc-700 hover:bg-zinc-100/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedBooking(row)}
                    >
                      <td className="py-3 px-4 font-mono text-xs">{row.bookingId || `#${row.id}`}</td>
                      <td className="py-3 px-4">{row.customerName || "-"}</td>
                      <td className="py-3 px-4">{row.route || "-"}</td>
                      <td className="py-3 px-4">{row.vehicleNumber || "-"}</td>
                      <td className="py-3 px-4 text-center">{row.passengers ?? "-"}</td>
                      <td className="py-3 px-4 text-right">Rs. {row.totalAmount?.toLocaleString?.() ?? row.totalAmount ?? 0}</td>
                      <td className="py-3 px-4">{statusBadge(row.paymentStatus, "payment")}</td>
                      <td className="py-3 px-4">{statusBadge(row.status)}</td>
                      <td className="py-3 px-4">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedBooking(row) }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-zinc-100 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
            <div className="relative w-full max-w-lg rounded-xl bg-white border border-zinc-200 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Booking {selectedBooking.bookingId || `#${selectedBooking.id}`}
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500">Customer</p>
                    <p className="text-zinc-200">{selectedBooking.customerName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Phone</p>
                    <p className="text-zinc-200">{selectedBooking.customerPhone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Route</p>
                    <p className="text-zinc-200">{selectedBooking.route || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Vehicle</p>
                    <p className="text-zinc-200">{selectedBooking.vehicleNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Passengers</p>
                    <p className="text-zinc-200">{selectedBooking.passengers ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Amount</p>
                    <p className="text-zinc-200">Rs. {selectedBooking.totalAmount?.toLocaleString?.() ?? selectedBooking.totalAmount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Payment</p>
                    <div className="mt-0.5">{statusBadge(selectedBooking.paymentStatus, "payment")}</div>
                  </div>
                  <div>
                    <p className="text-zinc-500">Status</p>
                    <div className="mt-0.5">{statusBadge(selectedBooking.status)}</div>
                  </div>
                  <div>
                    <p className="text-zinc-500">Date</p>
                    <p className="text-zinc-200">{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : "-"}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Payment Method</p>
                    <p className="text-zinc-200 capitalize">{selectedBooking.paymentMethod || "-"}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200">
                {selectedBooking.status !== "cancelled" && selectedBooking.status !== "completed" && (
                  <Button variant="danger" size="sm" onClick={() => handleCancel(selectedBooking)}>
                    <Ban className="h-4 w-4" />
                    Cancel Booking
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}
