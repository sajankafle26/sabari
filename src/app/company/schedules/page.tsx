"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { DataTable } from "@/components/admin/data-table"
import { FormModal } from "@/components/admin/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Schedule {
  id: number
  routeName: string
  vehicleNumber: string
  driverName: string
  departureTime: string
  arrivalTime: string
  fare: number
  discountedFare: number
  status: string
  frequency: string
  date: string
  recurring: boolean
}

const defaultForm = {
  vehicleId: "",
  driverId: "",
  routeId: "",
  departureTime: "",
  arrivalTime: "",
  fare: "",
  discountedFare: "",
  frequency: "daily",
  date: "",
  recurring: false,
}

export default function SchedulesPage() {
  const [data, setData] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0])

  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])

  const fetchData = async () => {
    try {
      const res = await api.get("/company/schedules")
      setData(res.data.schedules)
    } catch {
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  const fetchOptions = async () => {
    try {
      const [vRes, dRes, rRes] = await Promise.all([
        api.get("/company/vehicles"),
        api.get("/company/drivers"),
        api.get("/admin/routes"),
      ])
      setVehicles(vRes.data)
      setDrivers(dRes.data)
      setRoutes(rRes.data)
    } catch {}
  }

  useEffect(() => { fetchData(); fetchOptions() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      vehicleId: row.vehicleId || "",
      driverId: row.driverId || "",
      routeId: row.routeId || "",
      departureTime: row.departureTime || "",
      arrivalTime: row.arrivalTime || "",
      fare: String(row.fare || ""),
      discountedFare: String(row.discountedFare || ""),
      frequency: row.frequency || "daily",
      date: row.date ? row.date.split("T")[0] : "",
      recurring: row.recurring || false,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      ...form,
      fare: Number(form.fare),
      discountedFare: form.discountedFare ? Number(form.discountedFare) : null,
    }
    try {
      if (editing) {
        await api.patch(`/company/schedules/${editing.id}`, payload)
        toast.success("Schedule updated")
      } else {
        await api.post("/company/schedules", payload)
        toast.success("Schedule created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Schedule) => {
    if (!confirm(`Delete schedule?`)) return
    try {
      await api.delete(`/company/schedules/${row.id}`)
      toast.success("Schedule deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete schedule")
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-600/10",
      cancelled: "text-red-600 bg-red-600/10",
      completed: "text-blue-600 bg-blue-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const filteredData = filterDate
    ? data.filter((s) => s.date?.startsWith(filterDate))
    : data

  const columns = [
    { key: "routeName", label: "Route" },
    { key: "vehicleNumber", label: "Vehicle" },
    { key: "driverName", label: "Driver" },
    {
      key: "departureTime",
      label: "Departure → Arrival",
      render: (_: any, row: Schedule) => `${row.departureTime || "-"} → ${row.arrivalTime || "-"}`,
    },
    {
      key: "fare",
      label: "Fare",
      render: (value: number) => value ? `Rs. ${value.toLocaleString()}` : "-",
    },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: Schedule) => statusBadge(row.status),
    },
  ]

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Schedules</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-zinc-500" />
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-48"
          />
        </div>

        <DataTable columns={columns} data={filteredData} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Schedule" : "Add Schedule"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            >
              <option value="" className="bg-white">Select vehicle</option>
              {vehicles.map((v: any) => (
                <option key={v.id} value={v.id} className="bg-white">{v.vehicleNumber}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Driver</label>
            <select
              value={form.driverId}
              onChange={(e) => setForm({ ...form, driverId: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            >
              <option value="" className="bg-white">Select driver</option>
              {drivers.map((d: any) => (
                <option key={d.id} value={d.id} className="bg-white">{d.fullName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Route</label>
            <select
              value={form.routeId}
              onChange={(e) => setForm({ ...form, routeId: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            >
              <option value="" className="bg-white">Select route</option>
              {routes.map((r: any) => (
                <option key={r.id} value={r.id} className="bg-white">{r.name} ({r.from} → {r.to})</option>
              ))}
            </select>
          </div>
          <Input label="Departure Time" type="time" value={form.departureTime} onChange={(e) => setForm({ ...form, departureTime: e.target.value })} required />
          <Input label="Arrival Time" type="time" value={form.arrivalTime} onChange={(e) => setForm({ ...form, arrivalTime: e.target.value })} required />
          <Input label="Fare (Rs.)" type="number" value={form.fare} onChange={(e) => setForm({ ...form, fare: e.target.value })} required />
          <Input label="Discounted Fare (Rs.)" type="number" value={form.discountedFare} onChange={(e) => setForm({ ...form, discountedFare: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Frequency</label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="daily" className="bg-white">Daily</option>
              <option value="weekly" className="bg-white">Weekly</option>
              <option value="custom" className="bg-white">Custom</option>
            </select>
          </div>
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.recurring}
              onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
              className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
            />
            Recurring schedule
          </label>
        </FormModal>
      </div>
    </CompanyLayout>
  )
}
