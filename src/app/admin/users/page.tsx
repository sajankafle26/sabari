"use client"

import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DataTable } from "@/components/admin/data-table"
import { FormModal } from "@/components/admin/form-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  company: { name: string } | null
  isActive: boolean
  lastLogin: string | null
}

const defaultForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "passenger",
  isActive: true,
}

const roleColors: Record<string, string> = {
  super_admin: "text-red-600 bg-red-600/10",
  company_admin: "text-violet-600 bg-violet-50",
  counter_operator: "text-cyan-600 bg-cyan-600/10",
  driver: "text-amber-600 bg-amber-600/10",
  passenger: "text-green-600 bg-green-600/10",
}

export default function UsersPage() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/users")
      setData(res.data.users)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openEdit = (row: User) => {
    setEditing(row)
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone || "",
      role: row.role,
      isActive: row.isActive,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editing) {
        await api.patch(`/admin/users/${editing.id}`, form)
        toast.success("User updated")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: User) => {
    if (!confirm(`Delete user ${row.firstName} ${row.lastName}?`)) return
    try {
      await api.delete(`/admin/users/${row.id}`)
      toast.success("User deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete user")
    }
  }

  const filtered = data.filter(
    (u) =>
      u.firstName.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (_: any, row: User) => `${row.firstName} ${row.lastName}`,
    },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "role",
      label: "Role",
      render: (value: string) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[value] || "text-zinc-500 bg-zinc-700/50"}`}>
          {value.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ),
    },
    {
      key: "company",
      label: "Company",
      render: (_: any, row: User) => row.company?.name || "-",
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
    {
      key: "lastLogin",
      label: "Last Login",
      render: (value: string | null) =>
        value ? new Date(value).toLocaleDateString() : "-",
    },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Users</h1>
        </div>

        <div className="max-w-sm">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Edit User"
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="super_admin">Super Admin</option>
              <option value="company_admin">Company Admin</option>
              <option value="counter_operator">Counter Operator</option>
              <option value="driver">Driver</option>
              <option value="passenger">Passenger</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
            />
            Active
          </label>
        </FormModal>
      </div>
    </AdminLayout>
  )
}
