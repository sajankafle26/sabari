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

const vehicleTypes = ["bus", "deluxe-bus", "ac-bus", "tourist-bus", "night-bus", "sumo", "hiace", "jeep", "ev-bus", "micro-bus"]
const seatLayouts = ["2x2", "2x1", "luxury", "sleeper", "hiace", "sumo", "custom"]
const amenityOptions = ["WiFi", "AC", "Charging", "Blanket", "Snacks", "Toilet", "Entertainment"]

interface Vehicle {
  id: number
  vehicleNumber: string
  type: string
  brand: string
  model: string
  year: number
  capacity: number
  seatLayout: string
  amenities: string[]
  status: string
  insuranceExpiry: string
  taxExpiry: string
}

const defaultForm = {
  vehicleNumber: "",
  type: "bus",
  brand: "",
  model: "",
  year: "",
  capacity: "",
  seatLayout: "2x2",
  amenities: [] as string[],
  status: "active",
  insuranceExpiry: "",
  taxExpiry: "",
}

export default function VehiclesPage() {
  const [data, setData] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await api.get("/company/vehicles")
      setData(res.data.vehicles)
    } catch {
      toast.error("Failed to load vehicles")
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

  const openEdit = (row: Vehicle) => {
    setEditing(row)
    setForm({
      vehicleNumber: row.vehicleNumber,
      type: row.type,
      brand: row.brand || "",
      model: row.model || "",
      year: String(row.year || ""),
      capacity: String(row.capacity || ""),
      seatLayout: row.seatLayout || "2x2",
      amenities: row.amenities || [],
      status: row.status,
      insuranceExpiry: row.insuranceExpiry ? row.insuranceExpiry.split("T")[0] : "",
      taxExpiry: row.taxExpiry ? row.taxExpiry.split("T")[0] : "",
    })
    setModalOpen(true)
  }

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = { ...form, year: Number(form.year), capacity: Number(form.capacity) }
    try {
      if (editing) {
        await api.patch(`/company/vehicles/${editing.id}`, payload)
        toast.success("Vehicle updated")
      } else {
        await api.post("/company/vehicles", payload)
        toast.success("Vehicle created")
      }
      setModalOpen(false)
      fetchData()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (row: Vehicle) => {
    if (!confirm(`Delete vehicle ${row.vehicleNumber}?`)) return
    try {
      await api.delete(`/company/vehicles/${row.id}`)
      toast.success("Vehicle deleted")
      fetchData()
    } catch {
      toast.error("Failed to delete vehicle")
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "text-green-600 bg-green-600/10",
      maintenance: "text-yellow-600 bg-yellow-600/10",
      inactive: "text-zinc-500 bg-zinc-700/50",
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "text-zinc-500 bg-zinc-700/50"}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    )
  }

  const columns = [
    { key: "vehicleNumber", label: "Vehicle #" },
    {
      key: "type",
      label: "Type",
      render: (value: string) => (
        <span className="capitalize">{value?.replace(/-/g, " ")}</span>
      ),
    },
    {
      key: "brand",
      label: "Brand / Model",
      render: (_: any, row: Vehicle) => `${row.brand || ""} ${row.model || ""}`.trim() || "-",
    },
    { key: "capacity", label: "Capacity" },
    {
      key: "status",
      label: "Status",
      render: (_: any, row: Vehicle) => statusBadge(row.status),
    },
    {
      key: "insuranceExpiry",
      label: "Insurance Expiry",
      render: (value: string) => value ? new Date(value).toLocaleDateString() : "-",
    },
  ]

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Vehicles</h1>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>

        <DataTable columns={columns} data={data} onEdit={openEdit} onDelete={handleDelete} loading={loading} />

        <FormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Vehicle" : "Add Vehicle"}
          onSubmit={handleSubmit}
          loading={submitting}
        >
          <Input label="Vehicle Number" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {vehicleTypes.map((t) => (
                <option key={t} value={t} className="bg-white">{t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <Input label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <Input label="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Seat Layout</label>
            <select
              value={form.seatLayout}
              onChange={(e) => setForm({ ...form, seatLayout: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {seatLayouts.map((l) => (
                <option key={l} value={l} className="bg-white">{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {amenityOptions.map((a) => (
                <label key={a} className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="rounded border-zinc-300 bg-zinc-100 text-violet-600 focus:ring-violet-500"
                  />
                  {a}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="active" className="bg-white">Active</option>
              <option value="maintenance" className="bg-white">Maintenance</option>
              <option value="inactive" className="bg-white">Inactive</option>
            </select>
          </div>
          <Input label="Insurance Expiry" type="date" value={form.insuranceExpiry} onChange={(e) => setForm({ ...form, insuranceExpiry: e.target.value })} />
          <Input label="Tax Expiry" type="date" value={form.taxExpiry} onChange={(e) => setForm({ ...form, taxExpiry: e.target.value })} />
        </FormModal>
      </div>
    </CompanyLayout>
  )
}
