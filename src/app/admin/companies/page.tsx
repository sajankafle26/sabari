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

interface Company {
  _id: string
  name: string
  registrationNumber: string
  phone: string
  email: string
  address?: { district?: string; municipality?: string; ward?: string; street?: string }
  status: string
  subscription?: { plan?: { name: string } | null }
}

const defaultForm = {
  name: "",
  registrationNumber: "",
  phone: "",
  email: "",
  district: "",
  municipality: "",
  ward: "",
  street: "",
}

export default function CompaniesPage() {
  const [data, setData] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/admin/companies")
      setData(res.data.companies || [])
    } catch {
      toast.error("Failed to load companies")
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

  const openEdit = (row: Company) => {
    setEditing(row)
    setForm({
      name: row.name || "",
      registrationNumber: row.registrationNumber || "",
      phone: row.phone || "",
      email: row.email || "",
      district: row.address?.district || "",
      municipality: row.address?.municipality || "",
      ward: row.address?.ward || "",
      street: row.address?.street || "",
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        registrationNumber: form.registrationNumber,
        phone: form.phone,
        email: form.email,
        address: {
          district: form.district,
          municipality: form.municipality,
          ward: form.ward,
          street: form.street,
        },
      }

      if (editing) {
        await api.patch(`/admin/companies/${editing._id}`, payload)
        toast.success("Company updated")
      } else {
        await api.post("/admin/companies", payload)
        toast.success("Company created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Company) => {
    if (!confirm(`Delete ${row.name}?`)) return
    try {
      await api.delete(`/admin/companies/${row._id}`)
      toast.success("Company deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete company")
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-600/10",
      suspended: "text-red-600 bg-red-600/10",
      pending: "text-yellow-600 bg-yellow-600/10",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const columns = [
    { key: "name", label: "Name" },
    { key: "registrationNumber", label: "Registration #" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address.district", label: "District", render: (_: any, row: Company) => row.address?.district || "—" },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: Company) => statusBadge(row.status),
    },
    { key: "subscription", label: "Plan", render: (_: any, row: Company) => row.subscription?.plan?.name || "—" },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Transport Companies</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Company
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
          title={editing ? "Edit Company" : "Add Company"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Registration #" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <Input label="Municipality" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
          <Input label="Ward" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value })} />
          <Input label="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
        </FormModal>
      </div>
    </AdminLayout>
  )
}
