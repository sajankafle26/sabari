"use client"

import { useState, useEffect } from "react"
import { Car, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin/admin-layout"
import { DataTable } from "@/components/admin/data-table"
import { FormModal } from "@/components/admin/form-modal"
import { toast } from "sonner"
import api from "@/lib/api"

const defaultTypes = [
  { name: "Bus", label: "Bus", icon: "🚌", capacity: 40, description: "Standard passenger bus" },
  { name: "Deluxe Bus", label: "Deluxe Bus", icon: "🚌", capacity: 36, description: "Deluxe comfort bus" },
  { name: "AC Bus", label: "AC Bus", icon: "🚌", capacity: 32, description: "Air conditioned bus" },
  { name: "Tourist Bus", label: "Tourist Bus", icon: "🚌", capacity: 40, description: "Tourist sightseeing bus" },
  { name: "Night Bus", label: "Night Bus", icon: "🌙", capacity: 30, description: "Overnight sleeper bus" },
  { name: "Sumo", label: "Sumo", icon: "🚙", capacity: 8, description: "Off-road vehicle" },
  { name: "Hiace", label: "Hiace", icon: "🚐", capacity: 14, description: "Minibus for group travel" },
  { name: "Jeep", label: "Jeep", icon: "🚙", capacity: 6, description: "Adventure vehicle" },
  { name: "EV Bus", label: "EV Bus", icon: "⚡", capacity: 36, description: "Electric bus" },
  { name: "Electric Van", label: "Electric Van", icon: "⚡", capacity: 10, description: "Electric van" },
  { name: "Micro Bus", label: "Micro Bus", icon: "🚐", capacity: 20, description: "Mini bus" },
]

export default function VehicleTypesPage() {
  const [types, setTypes] = useState(defaultTypes)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", label: "", icon: "🚌", capacity: 40, description: "" })

  const openAdd = () => { setEditing(null); setForm({ name: "", label: "", icon: "🚌", capacity: 40, description: "" }); setModalOpen(true) }

  const openEdit = (row: any) => { setEditing(row); setForm(row); setModalOpen(true) }

  const handleDelete = (row: any) => {
    setTypes((prev) => prev.filter((t) => t.name !== row.name))
    toast.success(`"${row.label}" removed`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      setTypes((prev) => prev.map((t) => (t.name === editing.name ? form : t)))
      toast.success("Vehicle type updated")
    } else {
      setTypes((prev) => [...prev, form])
      toast.success("Vehicle type added")
    }
    setModalOpen(false)
  }

  const columns = [
    { key: "icon", label: "", render: (v: string) => <span className="text-xl">{v}</span> },
    { key: "label", label: "Name" },
    { key: "name", label: "Slug" },
    { key: "capacity", label: "Capacity" },
    { key: "description", label: "Description" },
  ]

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Vehicle Types</h1>
            <p className="text-zinc-500 mt-1">Manage vehicle types available on the platform</p>
          </div>
          <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4" /> Add Type</Button>
        </div>

        <DataTable columns={columns} data={types} onEdit={openEdit} onDelete={handleDelete} />

        <FormModal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Vehicle Type" : "Add Vehicle Type"} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input label="Label (Display Name)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <Input label="Slug (API Name)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-700">Icon</label>
              <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500">
                <option value="🚌">🚌 Bus</option>
                <option value="🚐">🚐 Van</option>
                <option value="🚙">🚙 SUV</option>
                <option value="⚡">⚡ Electric</option>
                <option value="🌙">🌙 Night</option>
              </select>
            </div>
            <Input label="Capacity" type="number" value={form.capacity.toString()} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </FormModal>
      </div>
    </AdminLayout>
  )
}
