"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts"
import { Download, Loader2, Calendar, TrendingUp, TrendingDown, IndianRupee, Bus, Users, MapPin } from "lucide-react"
import { CompanyLayout } from "@/components/company/company-layout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatPrice } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

const reportTypes = [
  { id: "daily-revenue", label: "Daily Revenue", icon: TrendingUp },
  { id: "monthly-revenue", label: "Monthly Revenue", icon: TrendingUp },
  { id: "vehicle-income", label: "Vehicle Income", icon: Bus },
  { id: "driver-income", label: "Driver Income", icon: Users },
  { id: "seat-occupancy", label: "Seat Occupancy", icon: Users },
  { id: "profit-loss", label: "Profit & Loss", icon: IndianRupee },
  { id: "counter-income", label: "Counter Income", icon: Users },
  { id: "fuel", label: "Fuel Consumption", icon: TrendingUp },
  { id: "gps-trail", label: "GPS Trail", icon: MapPin },
]

const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"]

export default function ReportsPage() {
  const [type, setType] = useState("daily-revenue")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30)
    return d.toISOString().split("T")[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0])

  const fetchReport = async () => {
    try {
      setLoading(true)
      const { data: res } = await api.get("/api/company/reports", {
        params: { type, from, to },
      })
      setData(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load report")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [type])

  const handleExport = () => {
    if (!data) return
    const rows = Array.isArray(data) ? data : [data]
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csv = [headers.join(","), ...rows.map((r: any) => headers.map(h => {
      const val = r[h]
      return typeof val === "string" && val.includes(",") ? `"${val}"` : val ?? ""
    }).join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${type}-${from}-${to}.csv`
      a.click()
      URL.revokeObjectURL(url)
  }

  const renderChart = () => {
    if (!data) return null

    switch (type) {
      case "daily-revenue":
      case "monthly-revenue": {
        const chartData = Array.isArray(data) ? data : []
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey={type === "daily-revenue" ? "date" : "_id"} stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" name="Bookings" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case "vehicle-income": {
        const chartData = Array.isArray(data) ? data : []
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#71717a" fontSize={12} />
              <YAxis dataKey="vehicle" type="category" stroke="#71717a" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              <Bar dataKey="bookings" name="Bookings" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case "driver-income": {
        const chartData = Array.isArray(data) ? data : []
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#71717a" fontSize={12} />
              <YAxis dataKey="driver" type="category" stroke="#71717a" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              <Legend />
              <Bar dataKey="trips" name="Trips" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              <Bar dataKey="totalDistance" name="Distance (km)" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case "seat-occupancy": {
        const chartData = Array.isArray(data) ? data : []
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="vehicle" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              <Legend />
              <Bar dataKey="occupancyRate" name="Occupancy %" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookedSeats" name="Booked Seats" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case "counter-income": {
        const chartData = Array.isArray(data) ? data : []
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#71717a" fontSize={12} />
              <YAxis dataKey="counter" type="category" stroke="#71717a" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              <Bar dataKey="bookings" name="Bookings" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case "fuel": {
        const chartData = Array.isArray(data) ? data : []
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#71717a" fontSize={12} />
              <YAxis dataKey="vehicle" type="category" stroke="#71717a" fontSize={12} width={120} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              <Legend />
              <Bar dataKey="totalLiters" name="Liters" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              <Bar dataKey="totalCost" name="Cost (Rs.)" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      }

      case "profit-loss": {
        if (!data) return null
        const chartData = [
          { name: "Revenue", value: data.revenue || 0 },
          { name: "Commission", value: data.commission || 0 },
          { name: "Discount", value: data.discount || 0 },
          { name: "Expenses", value: data.expenses || 0 },
        ]
        const profitColors = data.profit >= 0 ? "#10b981" : "#ef4444"
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: data.revenue || 0, color: "text-green-600" },
                { label: "Commission", value: data.commission || 0, color: "text-yellow-600" },
                { label: "Expenses", value: data.expenses || 0, color: "text-red-600" },
                { label: "Net Profit", value: (data.profit || 0), color: data.profit >= 0 ? "text-green-600" : "text-red-600" },
              ].map((item) => (
                <Card key={item.label} className="p-4">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className={`text-lg font-bold mt-1 ${item.color}`}>{formatPrice(item.value)}</p>
                </Card>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}>
                  {chartData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      }

      default:
        return <p className="text-zinc-500 text-center py-8">Select a report type</p>
    }
  }

  const renderTable = () => {
    if (!data) return null
    if (!Array.isArray(data)) return null
    if (data.length === 0) return <p className="text-zinc-500 text-center py-8">No data for this period</p>

    return (
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              {Object.keys(data[0]).map((key) => (
                <th key={key} className="text-left py-3 px-3 text-zinc-500 font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, idx: number) => (
              <tr key={idx} className="border-b border-zinc-200/50 hover:bg-zinc-100/20">
                {Object.values(row).map((val: any, cidx: number) => (
                  <td key={cidx} className="py-3 px-3 text-zinc-200">
                    {typeof val === "number" && Object.keys(row)[cidx].includes("revenue") || Object.keys(row)[cidx].includes("amount") || Object.keys(row)[cidx].includes("income")
                      ? formatPrice(val)
                      : typeof val === "number" ? val.toLocaleString() : val || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Reports & Analytics</h1>
            <p className="text-zinc-500 text-sm mt-1">View revenue, expenses, and performance metrics</p>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!data}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {reportTypes.map((rt) => (
            <button
              key={rt.id}
              onClick={() => setType(rt.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                type === rt.id ? "bg-violet-600/20 text-violet-600" : "bg-zinc-50 text-zinc-500 hover:text-zinc-900"
              )}
            >
              <rt.icon className="h-4 w-4" />
              {rt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            <span className="text-zinc-500">to</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
          </div>
          <Button size="sm" variant="outline" onClick={fetchReport}>
            Apply
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {reportTypes.find((rt) => rt.id === type)?.icon && (
                  <TrendingUp className="h-5 w-5 text-violet-600" />
                )}
                {reportTypes.find((rt) => rt.id === type)?.label || "Report"}
              </CardTitle>
              <CardDescription>
                {from} to {to}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderChart()}
              {renderTable()}
            </CardContent>
          </Card>
        )}
      </div>
    </CompanyLayout>
  )
}
