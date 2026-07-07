"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DataTable } from "@/components/admin/data-table"
import { FormModal } from "@/components/admin/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api"
import { toast } from "sonner"

const provinces = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
]

export default function DistrictsPage() {
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({ name: "", province: "", code: "", isActive: true })

  const fetchDistricts = async () => {
    try {
      setLoading(true)
      const { data } = await api.get("/admin/districts")
      setDistricts(data.districts || data.data || [])
    } catch {
      toast.error("Failed to load districts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDistricts()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", province: "", code: "", isActive: true })
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      name: row.name ?? "",
      province: row.province ?? "",
      code: row.code ?? "",
      isActive: row.isActive ?? true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editing) {
        await api.patch(`/admin/districts/${editing._id}`, form)
        toast.success("District updated")
      } else {
        await api.post("/admin/districts", form)
        toast.success("District created")
      }
      setModalOpen(false)
      fetchDistricts()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: any) => {
    if (!confirm("Are you sure you want to delete this district?")) return
    try {
      await api.delete(`/admin/districts/${row._id}`)
      toast.success("District deleted")
      fetchDistricts()
    } catch {
      toast.error("Failed to delete district")
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "province", label: "Province" },
    { key: "code", label: "Code" },
    {
      key: "isActive",
      label: "Status",
      render: (v: boolean) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          v ? "text-green-600 bg-green-600/10" : "text-red-600 bg-red-600/10"
        }`}>
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Districts of Nepal</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage all districts across provinces</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add District
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={districts}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit District" : "Add District"}
          onSubmit={handleSubmit}
          loading={saving}
        >
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Province</label>
            <select
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
              required
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select province</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
            />
            <label htmlFor="isActive" className="text-sm text-zinc-700">Active</label>
          </div>
        </FormModal>
      </div>
    </AdminLayout>
  )
}
