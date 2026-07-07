"use client"

import { useState, useEffect } from "react"
import { Search, RotateCcw, Bus, ArrowRight, Loader2, Filter, Ban } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatPrice, formatDate, formatTime } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

interface RefundBooking {
  _id: string
  bookingId: string
  totalAmount: number
  bookingStatus: string
  paymentStatus: string
  journeyDate: string
  route?: { from: string; to: string }
  vehicle?: { vehicleNumber: string; type: string }
  schedule?: { departureTime: string; arrivalTime: string }
  cancellation?: {
    cancelledAt: string
    reason: string
    refundAmount: number
    refundStatus: string
    cancelledBy?: { firstName: string; lastName: string }
  }
  passengers: Array<{ name: string }>
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchRefunds = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter !== "all") params.status = statusFilter
      const { data } = await api.get("/admin/refunds", { params })
      setRefunds(data.refunds || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error("Failed to load refunds")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefunds()
  }, [page, statusFilter])

  const handleSearch = () => {
    setPage(1)
    fetchRefunds()
  }

  const handleProcessRefund = async (bookingId: string) => {
    if (!confirm("Process refund for this booking? This action cannot be undone.")) return
    try {
      setProcessing(bookingId)
      const { data } = await api.post("/admin/refunds/process", { bookingId })
      toast.success(data.message)
      fetchRefunds()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process refund")
    } finally {
      setProcessing(null)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Cancellations & Refunds</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage booking cancellations and process refunds</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search by booking ID or passenger name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "refunded", "none"].map((status) => (
              <button
                key={status}
                onClick={() => { setStatusFilter(status); setPage(1) }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === status
                    ? "bg-violet-600/20 text-violet-600"
                    : "bg-zinc-50 text-zinc-500 hover:text-zinc-900"
                )}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : refunds.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Ban className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500">No cancellations or refunds found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {refunds.map((refund) => (
              <Card key={refund._id}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-600/10 shrink-0">
                      <RotateCcw className="h-6 w-6 text-red-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="font-semibold text-zinc-900 text-sm">
                          {refund.route?.from || "N/A"} → {refund.route?.to || "N/A"}
                        </span>
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                          refund.cancellation?.refundStatus === "processed"
                            ? "bg-green-600/10 text-green-600"
                            : refund.cancellation?.refundStatus === "pending"
                            ? "bg-yellow-600/10 text-yellow-600"
                            : "bg-zinc-700/50 text-zinc-500"
                        )}>
                          {refund.cancellation?.refundStatus === "processed" ? "Refunded" :
                           refund.cancellation?.refundStatus === "pending" ? "Pending" : "No Refund"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                        <span>ID: {refund.bookingId}</span>
                        <span>{formatDate(refund.journeyDate)}</span>
                        <span>{refund.vehicle?.vehicleNumber || "N/A"}</span>
                        <span>{refund.passengers?.length || 0} passenger(s)</span>
                      </div>

                      {refund.cancellation && (
                        <div className="mt-2 text-xs text-zinc-500">
                          <p>
                            Cancelled {refund.cancellation.cancelledAt ? formatDate(refund.cancellation.cancelledAt) : "N/A"}
                            {refund.cancellation.cancelledBy && ` by ${refund.cancellation.cancelledBy.firstName} ${refund.cancellation.cancelledBy.lastName}`}
                          </p>
                          {refund.cancellation.reason && (
                            <p className="mt-0.5">Reason: {refund.cancellation.reason}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                      <span className="text-sm font-semibold text-zinc-900">
                        {formatPrice(refund.totalAmount)}
                      </span>
                      {refund.cancellation?.refundAmount != null && refund.cancellation.refundAmount > 0 && (
                        <span className="text-xs text-green-600">
                          Refund: {formatPrice(refund.cancellation.refundAmount)}
                        </span>
                      )}
                      <div className="flex gap-2 mt-1">
                        {refund.cancellation?.refundStatus === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProcessRefund(refund._id)}
                            loading={processing === refund._id}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Process Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  page === p ? "bg-violet-600 text-zinc-900" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
