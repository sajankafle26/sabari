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

const municipalityTypes = [
  "metropolitan",
  "sub-metropolitan",
  "municipality",
  "rural-municipality",
]

const typeBadges: Record<string, string> = {
  metropolitan: "text-purple-600 bg-purple-600/10",
  "sub-metropolitan": "text-blue-600 bg-blue-600/10",
  municipality: "text-green-600 bg-green-600/10",
  "rural-municipality": "text-yellow-600 bg-yellow-600/10",
}

function TypeBadge({ type }: { type: string }) {
  const colors = typeBadges[type] ?? "text-zinc-500 bg-zinc-600/10"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>
      {type}
    </span>
  )
}

export default function MunicipalitiesPage() {
  const [municipalities, setMunicipalities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    districtId: "",
    type: "municipality",
    wardCount: 0,
    isActive: true,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [munRes, distRes] = await Promise.all([
        api.get("/admin/municipalities"),
        api.get("/admin/districts"),
      ])
      setMunicipalities(munRes.data.municipalities ?? munRes.data.data ?? [])
      setDistricts(distRes.data.districts ?? distRes.data.data ?? [])
    } catch {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", districtId: "", type: "municipality", wardCount: 0, isActive: true })
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      name: row.name ?? "",
      districtId: row.districtId ?? row.district?._id ?? row.district?.id ?? "",
      type: row.type ?? "municipality",
      wardCount: row.wardCount ?? 0,
      isActive: row.isActive ?? true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (editing) {
        await api.patch(`/admin/municipalities/${editing._id}`, form)
        toast.success("Municipality updated")
      } else {
        await api.post("/admin/municipalities", form)
        toast.success("Municipality created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (row: any) => {
    if (!confirm("Are you sure you want to delete this municipality?")) return
    try {
      await api.delete(`/admin/municipalities/${row._id}`)
      toast.success("Municipality deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete municipality")
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "district",
      label: "District",
      render: (_: any, row: any) => row.district?.name ?? row.districtName ?? "-",
    },
    {
      key: "type",
      label: "Type",
      render: (v: string) => <TypeBadge type={v} />,
    },
    { key: "wardCount", label: "Wards" },
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
            <h1 className="text-2xl font-bold text-zinc-900">Municipalities</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage municipalities across districts</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Municipality
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={municipalities}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Municipality" : "Add Municipality"}
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
            <label className="block text-sm font-medium text-zinc-700">District</label>
            <select
              value={form.districtId}
              onChange={(e) => setForm({ ...form, districtId: e.target.value })}
              required
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="">Select district</option>
              {districts.map((d: any) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {municipalityTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Input
            label="Ward Count"
            type="number"
            value={form.wardCount}
            onChange={(e) => setForm({ ...form, wardCount: parseInt(e.target.value) || 0 })}
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
