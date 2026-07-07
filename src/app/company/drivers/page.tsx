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

interface Driver {
  id: number
  fullName: string
  phone: string
  email: string
  licenseNumber: string
  licenseExpiry: string
  status: string
}

const defaultForm = {
  fullName: "",
  phone: "",
  email: "",
  licenseNumber: "",
  licenseExpiry: "",
  status: "active",
}

export default function DriversPage() {
  const [data, setData] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/company/drivers")
      setData(res.data.drivers)
    } catch {
      toast.error("Failed to load drivers")
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

  const openEdit = (row: Driver) => {
    setEditing(row)
    setForm({
      fullName: row.fullName,
      phone: row.phone,
      email: row.email || "",
      licenseNumber: row.licenseNumber,
      licenseExpiry: row.licenseExpiry ? row.licenseExpiry.split("T")[0] : "",
      status: row.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await api.patch(`/company/drivers/${editing.id}`, form)
        toast.success("Driver updated")
      } else {
        await api.post("/company/drivers", form)
        toast.success("Driver created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Driver) => {
    if (!confirm(`Delete driver ${row.fullName}?`)) return
    try {
      await api.delete(`/company/drivers/${row.id}`)
      toast.success("Driver deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete driver")
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-600/10",
      inactive: "text-zinc-500 bg-zinc-700/50",
      suspended: "text-red-600 bg-red-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "licenseNumber", label: "License #" },
    {
      key: "licenseExpiry",
      label: "License Expiry",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "-",
    },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: Driver) => statusBadge(row.status),
    },
  ]

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Drivers</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Driver
          </Button>
        </div>

        <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Driver" : "Add Driver"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="License Number" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} required />
          <Input label="License Expiry" type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="active" className="bg-white">Active</option>
              <option value="inactive" className="bg-white">Inactive</option>
              <option value="suspended" className="bg-white">Suspended</option>
            </select>
          </div>
        </FormModal>
      </div>
    </CompanyLayout>
  )
}
