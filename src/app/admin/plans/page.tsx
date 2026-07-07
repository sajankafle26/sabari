"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DataTable } from "@/components/admin/data-table"
import { FormModal } from "@/components/admin/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Plan {
  id: number
  name: string
  description: string
  price: number
  duration: number
  maxVehicles: number
  maxDrivers: number
  maxCounters: number
  maxRoutes: number
  commissionRate: number
  hasLiveTracking: boolean
  hasReporting: boolean
  hasAPIAccess: boolean
  isActive: boolean
}

const defaultForm = {
  name: "",
  description: "",
  price: "",
  duration: "",
  maxVehicles: "",
  maxDrivers: "",
  maxCounters: "",
  maxRoutes: "",
  commissionRate: "",
  hasLiveTracking: false,
  hasReporting: false,
  hasAPIAccess: false,
  isActive: true,
}

export default function PlansPage() {
  const [data, setData] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/plans")
      setData(res.data.plans)
    } catch {
      toast.error("Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (row: Plan) => {
    setEditing(row)
    setForm({
      name: row.name,
      description: row.description || "",
      price: String(row.price),
      duration: String(row.duration),
      maxVehicles: String(row.maxVehicles || ""),
      maxDrivers: String(row.maxDrivers || ""),
      maxCounters: String(row.maxCounters || ""),
      maxRoutes: String(row.maxRoutes || ""),
      commissionRate: String(row.commissionRate || ""),
      hasLiveTracking: row.hasLiveTracking,
      hasReporting: row.hasReporting,
      hasAPIAccess: row.hasAPIAccess,
      isActive: row.isActive,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      ...form,
      price: Number(form.price),
      duration: Number(form.duration),
      maxVehicles: Number(form.maxVehicles),
      maxDrivers: Number(form.maxDrivers),
      maxCounters: Number(form.maxCounters),
      maxRoutes: Number(form.maxRoutes),
      commissionRate: Number(form.commissionRate),
    }
    try {
      if (editing) {
        await api.patch(`/admin/plans/${editing.id}`, payload)
        toast.success("Plan updated")
      } else {
        await api.post("/admin/plans", payload)
        toast.success("Plan created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Plan) => {
    if (!confirm(`Delete plan ${row.name}?`)) return
    try {
      await api.delete(`/admin/plans/${row.id}`)
      toast.success("Plan deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete plan")
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "price",
      label: "Price (Rs.)",
      render: (value: number) =>
        value != null
          ? `Rs. ${value.toLocaleString("ne-NP")}`
          : "-",
    },
    { key: "duration", label: "Duration (days)" },
    { key: "maxVehicles", label: "Max Vehicles" },
    { key: "maxDrivers", label: "Max Drivers" },
    { key: "maxCounters", label: "Max Counters" },
    {
      key: "commissionRate",
      label: "Commission %",
      render: (value: number) => (value != null ? `${value}%` : "-"),
    },
    {
      key: "isActive",
      label: "Status",
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? "text-green-600 bg-green-600/10" : "text-red-600 bg-red-600/10"}`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Subscription Plans</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Plan
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={data}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Plan" : "Add Plan"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Price (Rs.)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <Input label="Duration (days)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
          <Input label="Max Vehicles" type="number" value={form.maxVehicles} onChange={(e) => setForm({ ...form, maxVehicles: e.target.value })} />
          <Input label="Max Drivers" type="number" value={form.maxDrivers} onChange={(e) => setForm({ ...form, maxDrivers: e.target.value })} />
          <Input label="Max Counters" type="number" value={form.maxCounters} onChange={(e) => setForm({ ...form, maxCounters: e.target.value })} />
          <Input label="Max Routes" type="number" value={form.maxRoutes} onChange={(e) => setForm({ ...form, maxRoutes: e.target.value })} />
          <Input label="Commission Rate (%)" type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.hasLiveTracking} onChange={(e) => setForm({ ...form, hasLiveTracking: e.target.checked })} className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500" />
            Live Tracking
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.hasReporting} onChange={(e) => setForm({ ...form, hasReporting: e.target.checked })} className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500" />
            Reporting
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.hasAPIAccess} onChange={(e) => setForm({ ...form, hasAPIAccess: e.target.checked })} className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500" />
            API Access
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500" />
            Active
          </label>
        </FormModal>
      </div>
    </AdminLayout>
  )
}
