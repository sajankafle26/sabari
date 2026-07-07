"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { DataTable } from "@/components/admin/data-table"
import { FormModal } from "@/components/admin/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Counter {
  id: number
  name: string
  code: string
  phone: string
  email: string
  address: {
    district: string
    municipality: string
    ward: string
    street: string
  }
  status: string
}

const defaultForm = {
  name: "",
  phone: "",
  email: "",
  district: "",
  municipality: "",
  ward: "",
  street: "",
  status: "active",
}

export default function CountersPage() {
  const [data, setData] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Counter | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/company/counters")
      setData(res.data.counters)
    } catch {
      toast.error("Failed to load counters")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (row: Counter) => {
    setEditing(row)
    setForm({
      name: row.name,
      phone: row.phone,
      email: row.email || "",
      district: row.address?.district || "",
      municipality: row.address?.municipality || "",
      ward: row.address?.ward || "",
      street: row.address?.street || "",
      status: row.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: {
        district: form.district,
        municipality: form.municipality,
        ward: form.ward,
        street: form.street,
      },
      status: form.status,
    }
    try {
      if (editing) {
        await api.patch(`/company/counters/${editing.id}`, payload)
        toast.success("Counter updated")
      } else {
        await api.post("/company/counters", payload)
        toast.success("Counter created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Counter) => {
    if (!confirm(`Delete counter ${row.name}?`)) return
    try {
      await api.delete(`/company/counters/${row.id}`)
      toast.success("Counter deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete counter")
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-600/10",
      inactive: "text-zinc-500 bg-zinc-700/50",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "code", label: "Code" },
    {
      key: "district",
      label: "District",
      render: (_: any, row: Counter) => row.address?.district || "-",
    },
    { key: "phone", label: "Phone" },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: Counter) => statusBadge(row.status),
    },
  ]

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Counters</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Counter
          </Button>
        </div>

        <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Counter" : "Add Counter"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <Input label="Municipality" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
          <Input label="Ward" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
          <Input label="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="active" className="bg-white">Active</option>
              <option value="inactive" className="bg-white">Inactive</option>
            </select>
          </div>
        </FormModal>
      </div>
    </CompanyLayout>
  )
}
