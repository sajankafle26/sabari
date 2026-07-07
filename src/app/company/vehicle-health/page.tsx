"use client"

import { useState, useEffect } from "react"
import {
  Fuel,
  Gauge,
  Wrench,
  Shield,
  FileText,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface VehicleHealth {
  _id: string
  vehicleNumber: string
  type: string
  status: string
  fuelLevel: number
  currentMileage: number
  nextServiceMileage: number
  nextServiceDate: string
  lastServicedAt: string
  insurance: { expiryDate: string }
  taxExpiry: string
  permitExpiry: string
  fuelType: string
  mileagePerLiter: number
}

interface HealthStats {
  total: number
  active: number
  maintenance: number
  lowFuel: number
  serviceDue: number
  insuranceExpiring: number
  taxExpiring: number
  permitExpiring: number
}

const daysUntil = (dateStr: string): number | null => {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const statusColor = (days: number | null) => {
  if (days === null) return "text-zinc-500"
  if (days < 0) return "text-red-600"
  if (days <= 30) return "text-yellow-600"
  return "text-green-600"
}

function VehicleHealthDashboard() {
  const [vehicles, setVehicles] = useState<VehicleHealth[]>([])
  const [stats, setStats] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logVehicle, setLogVehicle] = useState("")
  const [logType, setLogType] = useState("fuel")
  const [logAmount, setLogAmount] = useState("")
  const [logQuantity, setLogQuantity] = useState("")
  const [logOdometer, setLogOdometer] = useState("")
  const [logDescription, setLogDescription] = useState("")
  const [logVendor, setLogVendor] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get("/company/vehicles/health")
      .then((res) => {
        setVehicles(res.data.vehicles || [])
        setStats(res.data.stats || null)
      })
      .catch(() => toast.error("Failed to load vehicle health"))
      .finally(() => setLoading(false))
  }, [])

  const handleAddLog = async () => {
    if (!logVehicle || !logType) {
      toast.error("Please select vehicle and log type")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/company/vehicle-logs", {
        vehicle: logVehicle,
        type: logType,
        amount: logAmount ? Number(logAmount) : undefined,
        quantity: logQuantity ? Number(logQuantity) : undefined,
        odometerReading: logOdometer ? Number(logOdometer) : undefined,
        description: logDescription,
        vendor: logVendor,
      })
      toast.success("Log entry saved")
      setShowLogModal(false)
      setLogAmount(""), setLogQuantity(""), setLogOdometer(""), setLogDescription(""), setLogVendor("")
      const res = await api.get("/company/vehicles/health")
      setVehicles(res.data.vehicles || [])
      setStats(res.data.stats || null)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save log")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <CompanyLayout>
        <div className="p-6 space-y-6">
          <h1 className="text-2xl font-bold text-zinc-900">Vehicle Health</h1>
          <div className="flex items-center justify-center h-64 rounded-xl bg-white/80 border border-zinc-200">
            <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
          </div>
        </div>
      </CompanyLayout>
    )
  }

  const statCards = stats ? [
    { label: "Total Vehicles", value: stats.total, icon: Gauge, color: "text-blue-600" },
    { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-green-600" },
    { label: "Maintenance", value: stats.maintenance, icon: Wrench, color: "text-orange-400" },
    { label: "Low Fuel", value: stats.lowFuel, icon: Fuel, color: "text-yellow-600" },
    { label: "Service Due", value: stats.serviceDue, icon: Clock, color: "text-red-600" },
    { label: "Insurance Expiring", value: stats.insuranceExpiring, icon: Shield, color: "text-purple-600" },
    { label: "Tax Expiring", value: stats.taxExpiring, icon: FileText, color: "text-cyan-600" },
    { label: "Permit Expiring", value: stats.permitExpiring, icon: CalendarCheck, color: "text-pink-400" },
  ] : []

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Vehicle Health Dashboard</h1>
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setShowLogModal(true)}>
            <Plus className="h-4 w-4" /> Add Log Entry
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon
              return (
                <Card key={s.label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-zinc-100 ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-zinc-900">{s.value}</p>
                      <p className="text-xs text-zinc-500">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Gauge className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No vehicles found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((v) => {
              const insDays = daysUntil(v.insurance?.expiryDate)
              const taxDays = daysUntil(v.taxExpiry)
              const permitDays = daysUntil(v.permitExpiry)
              const servDays = v.nextServiceDate ? daysUntil(v.nextServiceDate) : null
              const serviceOverdue = v.nextServiceMileage && v.currentMileage && v.currentMileage >= v.nextServiceMileage

              return (
                <Card key={v._id} className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-1 h-full ${v.status === "active" ? "bg-green-500" : v.status === "maintenance" ? "bg-orange-500" : "bg-zinc-600"}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-zinc-900 text-base">{v.vehicleNumber}</CardTitle>
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                        v.status === "active" ? "text-green-600 bg-green-600/10" : "text-zinc-500 bg-zinc-700/50"
                      )}>{v.status}</span>
                    </div>
                    <p className="text-xs text-zinc-500 capitalize">{v.type?.replace(/-/g, " ")}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Fuel Level</span>
                      <span className="flex items-center gap-1.5">
                        <Fuel className={`h-3.5 w-3.5 ${(v.fuelLevel ?? 100) < 25 ? "text-red-600" : "text-green-600"}`} />
                        {v.fuelLevel ?? 100}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Mileage</span>
                      <span className="text-zinc-200">{v.currentMileage?.toLocaleString() || 0} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Service</span>
                      <span className={serviceOverdue ? "text-red-600" : "text-zinc-200"}>
                        {v.nextServiceMileage ? `${v.nextServiceMileage.toLocaleString()} km` : servDays !== null ? `${servDays}d` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Insurance</span>
                      <span className={statusColor(insDays)}>{insDays !== null ? `${insDays}d` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Tax</span>
                      <span className={statusColor(taxDays)}>{taxDays !== null ? `${taxDays}d` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Permit</span>
                      <span className={statusColor(permitDays)}>{permitDays !== null ? `${permitDays}d` : "—"}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowLogModal(false)} />
            <div className="relative w-full max-w-md rounded-xl bg-white border border-zinc-200 shadow-2xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-zinc-900">Add Vehicle Log Entry</h2>

              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Vehicle *</label>
                <select
                  className="w-full rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  value={logVehicle}
                  onChange={(e) => setLogVehicle(e.target.value)}
                >
                  <option value="">Select vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>{v.vehicleNumber}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-zinc-500 mb-1 block">Type *</label>
                <select
                  className="w-full rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-violet-500"
                  value={logType}
                  onChange={(e) => setLogType(e.target.value)}
                >
                  <option value="fuel">Fuel</option>
                  <option value="service">Service</option>
                  <option value="mileage">Mileage Reading</option>
                  <option value="repair">Repair</option>
                  <option value="inspection">Inspection</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Amount (Rs.)" type="number" placeholder="0" value={logAmount} onChange={(e) => setLogAmount(e.target.value)} />
                <Input label={logType === "fuel" ? "Liters" : "Quantity"} type="number" placeholder="0" value={logQuantity} onChange={(e) => setLogQuantity(e.target.value)} />
              </div>

              <Input label="Odometer Reading (km)" type="number" placeholder="0" value={logOdometer} onChange={(e) => setLogOdometer(e.target.value)} />
              <Input label="Description" placeholder="Optional notes" value={logDescription} onChange={(e) => setLogDescription(e.target.value)} />
              <Input label="Vendor" placeholder="Vendor name" value={logVendor} onChange={(e) => setLogVendor(e.target.value)} />

              <div className="flex gap-3 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowLogModal(false)} disabled={submitting}>Close</Button>
                <Button variant="primary" size="sm" onClick={handleAddLog} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  )
}

export default function VehicleHealthPage() {
  return <VehicleHealthDashboard />
}
