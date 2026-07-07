"use client"

import { useState, useEffect } from "react"
import { IndianRupee, Pencil } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

interface ScheduleFare {
  id: number
  routeName: string
  vehicleNumber: string
  vehicleType: string
  departureTime: string
  arrivalTime: string
  fare: number
  discountedFare: number
}

export default function FaresPage() {
  const [data, setData] = useState<ScheduleFare[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editFare, setEditFare] = useState("")
  const [editDiscounted, setEditDiscounted] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/company/schedules")
      setData(res.data.schedules)
    } catch {
      toast.error("Failed to load fares")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const startEdit = (row: ScheduleFare) => {
    setEditingId(row.id)
    setEditFare(String(row.fare || ""))
    setEditDiscounted(String(row.discountedFare || ""))
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const saveFare = async (id: number) => {
    setSubmitting(true)
    try {
      await api.patch(`/company/schedules/${id}`, {
        fare: Number(editFare),
        discountedFare: editDiscounted ? Number(editDiscounted) : null,
      })
      toast.success("Fare updated")
      setEditingId(null)
      fetchData()
    } catch {
      toast.error("Failed to update fare")
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = (type: string) => {
    const colors: Record<string, string> = {
      bus: "text-violet-600 bg-violet-50",
      "ac-bus": "text-blue-600 bg-blue-600/10",
      "deluxe-bus": "text-cyan-600 bg-cyan-600/10",
      "tourist-bus": "text-emerald-400 bg-emerald-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[type] || "text-zinc-500 bg-zinc-700/50"}`}>
        {type?.replace(/-/g, " ")}
      </span>
    )
  }

  if (loading) {
    return (
      <CompanyLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Fares</h1>
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
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Fares</h1>
          <p className="text-zinc-500 mt-1">Manage fare overrides for schedules</p>
        </div>

        {data.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <IndianRupee className="h-12 w-12 text-zinc-700 mx-auto" />
                <p className="text-zinc-500 mt-4">No schedules found</p>
                <p className="text-zinc-600 text-sm mt-1">Create schedules first to manage fares</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-xl bg-white/80 border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Route</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Vehicle</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-zinc-500 font-medium">Departure → Arrival</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">Normal Fare (Rs.)</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium">Discounted Fare (Rs.)</th>
                    <th className="text-right py-3 px-4 text-zinc-500 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id} className="border-b border-zinc-200/50 text-zinc-700 hover:bg-zinc-100/30 transition-colors">
                      <td className="py-3 px-4">{row.routeName}</td>
                      <td className="py-3 px-4">{row.vehicleNumber}</td>
                      <td className="py-3 px-4">{statusBadge(row.vehicleType)}</td>
                      <td className="py-3 px-4">{row.departureTime || "-"} → {row.arrivalTime || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        {editingId === row.id ? (
                          <Input
                            type="number"
                            value={editFare}
                            onChange={(e) => setEditFare(e.target.value)}
                            className="w-28 ml-auto text-right"
                          />
                        ) : (
                          `Rs. ${row.fare?.toLocaleString?.() ?? row.fare ?? 0}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === row.id ? (
                          <Input
                            type="number"
                            value={editDiscounted}
                            onChange={(e) => setEditDiscounted(e.target.value)}
                            className="w-28 ml-auto text-right"
                          />
                        ) : (
                          row.discountedFare ? `Rs. ${row.discountedFare.toLocaleString()}` : "-"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === row.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                            <Button size="sm" onClick={() => saveFare(row.id)} loading={submitting}>Save</Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(row)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-violet-600 hover:bg-zinc-100 transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}
