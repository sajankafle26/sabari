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

interface Staff {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  lastLogin: string
}

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "staff",
  status: "active",
}

export default function StaffPage() {
  const [data, setData] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/company/staff")
      setData(res.data.staff)
    } catch {
      toast.error("Failed to load staff")
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

  const openEdit = (row: Staff) => {
    setEditing(row)
    setForm({
      firstName: row.firstName,
      lastName: row.lastName || "",
      email: row.email,
      phone: row.phone || "",
      password: "",
      role: row.role || "staff",
      status: row.status,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        const payload: any = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, status: form.status }
        if (form.password) payload.password = form.password
        await api.patch(`/company/staff/${editing.id}`, payload)
        toast.success("Staff updated")
      } else {
        await api.post("/company/staff", form)
        toast.success("Staff created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (row: Staff) => {
    if (!confirm(`Deactivate ${row.firstName} ${row.lastName}?`)) return
    try {
      await api.patch(`/company/staff/${row.id}`, { status: "inactive" })
      toast.success("Staff deactivated")
      fetchData()
    } catch {
      toast.error("Failed to deactivate staff")
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
    {
      key: "name",
      label: "Name",
      render: (_: any, row: Staff) => `${row.firstName} ${row.lastName || ""}`.trim(),
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: Staff) => statusBadge(row.status),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "Never",
    },
  ]

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Staff</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </div>

        <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDeactivate} loading={loading} />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Staff" : "Add Staff"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          {!editing && (
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          )}
          {editing && (
            <Input label="New Password (leave blank to keep)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          )}
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
