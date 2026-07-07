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

const commissionTypes = ["percentage", "fixed"]
const appliesToOptions = ["all", "company", "route", "vehicle_type"]

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    type: "percentage",
    value: 0,
    appliesTo: "all",
    companyId: "",
    isActive: true,
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const [commRes, compRes] = await Promise.all([
        api.get("/admin/commissions"),
        api.get("/admin/companies").catch(() => ({ data: { companies: [] } })),
      ])
      setCommissions(commRes.data.commissions ?? [])
      setCompanies(compRes.data.companies ?? [])
    } catch {
      toast.error("Failed to load commissions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ name: "", type: "percentage", value: 0, appliesTo: "all", companyId: "", isActive: true })
    setModalOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      name: row.name ?? "",
      type: row.type ?? "percentage",
      value: row.value ?? 0,
      appliesTo: row.appliesTo ?? "all",
      companyId: row.companyId ?? row.company?._id ?? "",
      isActive: row.isActive ?? true,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form }
      if (payload.appliesTo !== "company") payload.companyId = ""
      if (editing) {
        await api.patch(`/admin/commissions/${editing._id}`, payload)
        toast.success("Commission updated")
      } else {
        await api.post("/admin/commissions", payload)
        toast.success("Commission created")
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
    if (!confirm("Are you sure you want to delete this commission?")) return
    try {
      await api.delete(`/admin/commissions/${row._id}`)
      toast.success("Commission deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete commission")
    }
  }

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "type",
      label: "Type",
      render: (v: string) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          v === "percentage" ? "text-cyan-600 bg-cyan-600/10" : "text-amber-600 bg-amber-600/10"
        }`}>
          {v === "percentage" ? "%" : "Fixed"}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      render: (v: number) => v,
    },
    { key: "appliesTo", label: "Applies To" },
    {
      key: "company",
      label: "Company",
      render: (_: any, row: any) => row.company?.name ?? row.companyName ?? "-",
    },
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
            <h1 className="text-2xl font-bold text-zinc-900">Ticket Commissions</h1>
            <p className="text-zinc-500 text-sm mt-1">Manage commission structures</p>
          </div>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Commission
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={commissions}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Commission" : "Add Commission"}
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
            <label className="block text-sm font-medium text-zinc-700">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              required
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {commissionTypes.map((t) => (
                <option key={t} value={t}>{t === "percentage" ? "Percentage (%)" : "Fixed (Rs.)"}</option>
              ))}
            </select>
          </div>
          <Input
            label={form.type === "percentage" ? "Value (%)" : "Value (Rs.)"}
            type="number"
            step="any"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Applies To</label>
            <select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
              required
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              {appliesToOptions.map((o) => (
                <option key={o} value={o}>{o.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          {form.appliesTo === "company" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Company</label>
              <select
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                required
                className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">Select company</option>
                {companies.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
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
