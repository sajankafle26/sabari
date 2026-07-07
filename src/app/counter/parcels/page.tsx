"use client"

import { useState, useEffect } from "react"
import { Package, Plus, Search, Loader2, Printer, CheckCircle } from "lucide-react"
import { CounterLayout } from "@/components/counter/counter-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatDate, formatPrice } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

interface ParcelItem {
  _id: string
  trackingId: string
  sender: { name: string; phone: string }
  receiver: { name: string; phone: string }
  weight: number
  description: string
  status: string
  amount: number
  cod: boolean
  route?: { from: string; to: string }
  createdAt: string
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-600/10 text-yellow-600",
  picked_up: "bg-blue-600/10 text-blue-600",
  in_transit: "bg-violet-50 text-violet-600",
  arrived: "bg-cyan-600/10 text-cyan-600",
  out_for_delivery: "bg-orange-600/10 text-orange-400",
  delivered: "bg-green-600/10 text-green-600",
  cancelled: "bg-red-600/10 text-red-600",
}

const statusLabels: Record<string, string> = {
  pending: "Pending", picked_up: "Picked Up", in_transit: "In Transit",
  arrived: "Arrived", out_for_delivery: "Out for Delivery",
  delivered: "Delivered", cancelled: "Cancelled",
}

export default function CounterParcelsPage() {
  const [parcels, setParcels] = useState<ParcelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showRegister, setShowRegister] = useState(false)

  const fetchParcels = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (search) params.search = search
      const { data } = await api.get("/api/parcels", { params })
      setParcels(data.parcels || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error("Failed to load parcels")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchParcels() }, [page])

  const handleSearch = () => { setPage(1); fetchParcels() }

  const handlePickup = async (id: string) => {
    try {
      const { data } = await api.patch(`/api/parcels/${id}/status`, { status: "picked_up", note: "Picked up at counter" })
      toast.success(data.message)
      fetchParcels()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed")
    }
  }

  return (
    <CounterLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Parcel Management</h1>
            <p className="text-zinc-500 text-sm mt-1">Register and manage parcel deliveries</p>
          </div>
          <Button onClick={() => setShowRegister(true)}>
            <Plus className="h-4 w-4" />
            Register Parcel
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by tracking ID or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : parcels.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500">No parcels registered</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowRegister(true)}>
                <Plus className="h-4 w-4" />
                Register Parcel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {parcels.map((parcel) => (
              <Card key={parcel._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg shrink-0", statusColors[parcel.status])}>
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-violet-600 font-medium">{parcel.trackingId}</span>
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium", statusColors[parcel.status])}>
                            {statusLabels[parcel.status] || parcel.status}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-200 mt-0.5">
                          {parcel.sender?.name || "N/A"} → {parcel.receiver?.name || "N/A"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {parcel.weight} kg • {formatPrice(parcel.amount)} • {formatDate(parcel.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {parcel.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => handlePickup(parcel._id)}>
                          <CheckCircle className="h-3.5 w-3.5" />
                          Pick Up
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
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
              <button key={p} onClick={() => setPage(p)}
                className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors", page === p ? "bg-violet-600 text-zinc-900" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}>
                {p}
              </button>
            ))}
          </div>
        )}

        {showRegister && (
          <RegisterParcelModal onClose={() => setShowRegister(false)} onCreated={() => { setShowRegister(false); fetchParcels() }} />
        )}
      </div>
    </CounterLayout>
  )
}

function RegisterParcelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    senderName: "", senderPhone: "",
    receiverName: "", receiverPhone: "", receiverAddress: "",
    weight: "", description: "",
    amount: "", cod: false, codAmount: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.senderName || !form.senderPhone || !form.receiverName || !form.receiverPhone || !form.weight || !form.description || !form.amount) {
      toast.error("Please fill all required fields")
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post("/api/parcels", {
        sender: { name: form.senderName, phone: form.senderPhone },
        receiver: { name: form.receiverName, phone: form.receiverPhone, address: form.receiverAddress },
        weight: Number(form.weight),
        description: form.description,
        amount: Number(form.amount),
        cod: form.cod,
        codAmount: form.cod ? Number(form.codAmount || form.amount) : undefined,
      })
      toast.success(`Parcel registered: ${data.parcel.trackingId}`)
      onCreated()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to register parcel")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Register Parcel</h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">Sender</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} />
              <Input placeholder="Phone" value={form.senderPhone} onChange={(e) => setForm({ ...form, senderPhone: e.target.value })} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">Receiver</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} />
              <Input placeholder="Phone" value={form.receiverPhone} onChange={(e) => setForm({ ...form, receiverPhone: e.target.value })} />
            </div>
            <Input className="mt-2" placeholder="Delivery Address" value={form.receiverAddress} onChange={(e) => setForm({ ...form, receiverAddress: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" label="Weight (kg)" placeholder="5" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            <Input type="number" label="Amount (Rs.)" placeholder="500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <Input label="Description" placeholder="Parcel contents" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.cod} onChange={(e) => setForm({ ...form, cod: e.target.checked })} className="rounded border-zinc-300" />
            Cash on Delivery
          </label>
          {form.cod && (
            <Input type="number" label="COD Amount" placeholder="Same as amount if empty" value={form.codAmount} onChange={(e) => setForm({ ...form, codAmount: e.target.value })} />
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} loading={submitting}>Register Parcel</Button>
        </div>
      </div>
    </div>
  )
}
