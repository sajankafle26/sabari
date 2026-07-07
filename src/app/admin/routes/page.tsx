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

interface Route {
  id: number
  name: string
  from: string
  to: string
  fromDistrict: string
  toDistrict: string
  distance: number
  estimatedDuration: number
  popular: boolean
  isActive: boolean
}

const defaultForm = {
  name: "",
  from: "",
  to: "",
  fromDistrict: "",
  toDistrict: "",
  distance: "",
  estimatedDuration: "",
  popular: false,
}

export default function RoutesPage() {
  const [data, setData] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Route | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/routes")
      setData(res.data.routes)
    } catch {
      toast.error("Failed to load routes")
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

  const openEdit = (row: Route) => {
    setEditing(row)
    setForm({
      name: row.name,
      from: row.from,
      to: row.to,
      fromDistrict: row.fromDistrict || "",
      toDistrict: row.toDistrict || "",
      distance: String(row.distance || ""),
      estimatedDuration: String(row.estimatedDuration || ""),
      popular: row.popular,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      ...form,
      distance: Number(form.distance),
      estimatedDuration: Number(form.estimatedDuration),
    }
    try {
      if (editing) {
        await api.patch(`/admin/routes/${editing.id}`, payload)
        toast.success("Route updated")
      } else {
        await api.post("/admin/routes", payload)
        toast.success("Route created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Route) => {
    if (!confirm(`Delete route ${row.name}?`)) return
    try {
      await api.delete(`/admin/routes/${row.id}`)
      toast.success("Route deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete route")
    }
  }

  const statusBadge = (isActive: boolean | undefined) => {
    const active = isActive !== false
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${active ? "text-green-600 bg-green-600/10" : "text-zinc-500 bg-zinc-700/50"}`}>
        {active ? "Active" : "Inactive"}
      </span>
    )
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    {
      key: "distance",
      label: "Distance (km)",
      render: (value: number) => (value ? `${value} km` : "-"),
    },
    {
      key: "estimatedDuration",
      label: "Duration",
      render: (value: number) => (value ? `${value} mins` : "-"),
    },
    {
      key: "popular",
      label: "Popular",
      render: (value: boolean) =>
        value ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-amber-600 bg-amber-600/10">
            Popular
          </span>
        ) : (
          <span className="text-zinc-500 text-xs">-</span>
        ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (_: any, row: Route) => statusBadge(row.isActive),
    },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Routes</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Route
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
          title={editing ? "Edit Route" : "Add Route"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="From" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
          <Input label="To" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
          <Input label="From District" value={form.fromDistrict} onChange={(e) => setForm({ ...form, fromDistrict: e.target.value })} />
          <Input label="To District" value={form.toDistrict} onChange={(e) => setForm({ ...form, toDistrict: e.target.value })} />
          <Input label="Distance (km)" type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
          <Input label="Estimated Duration (mins)" type="number" value={form.estimatedDuration} onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.popular}
              onChange={(e) => setForm({ ...form, popular: e.target.checked })}
              className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
            />
            Popular route
          </label>
        </FormModal>
      </div>
    </AdminLayout>
  )
}
