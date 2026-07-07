"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Loader2, Calendar, IndianRupee, TrendingUp, CreditCard, Download } from "lucide-react"
import { CounterLayout } from "@/components/counter/counter-layout"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatPrice } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#3b82f6"]

const reportTypes = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "daily-revenue", label: "Daily Revenue", icon: IndianRupee },
  { id: "payment-breakdown", label: "Payment Methods", icon: CreditCard },
]

export default function CounterFinancePage() {
  const [type, setType] = useState("overview")
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
      const { data: res } = await api.get("/counter/finance", { params: { type, from, to } })
      setData(res.data.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load finance report")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport() }, [type])

  const handleExport = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `counter-finance-${type}-${from}-${to}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderChart = () => {
    if (!data) return null

    if (type === "overview") {
      const overviewCards = [
        { label: "Total Revenue", value: formatPrice(data.totalRevenue || 0), icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
        { label: "Your Commission", value: formatPrice(data.totalCommission || 0), icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Net Earnings", value: formatPrice(data.netEarnings || 0), icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Today's Revenue", value: formatPrice(data.todayRevenue || 0), icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Total Bookings", value: (data.totalBookings || 0).toLocaleString(), icon: TrendingUp, color: "text-cyan-600", bg: "bg-cyan-50" },
        { label: "Today's Bookings", value: (data.todayBookings || 0).toLocaleString(), icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
      ]
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewCards.map((card) => (
              <Card key={card.label} className="p-4">
                <div className={`p-2 rounded-lg ${card.bg} inline-flex`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-lg font-bold text-zinc-900 mt-3">{card.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
              </Card>
            ))}
          </div>
          {data.paymentMethods && data.paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Methods Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200">
                        <th className="text-left py-3 px-3 text-zinc-500 font-medium">Method</th>
                        <th className="text-right py-3 px-3 text-zinc-500 font-medium">Bookings</th>
                        <th className="text-right py-3 px-3 text-zinc-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.paymentMethods.map((p: any, idx: number) => (
                        <tr key={idx} className="border-b border-zinc-200/50 hover:bg-zinc-50">
                          <td className="py-3 px-3 text-zinc-900 font-medium capitalize">{p.method}</td>
                          <td className="py-3 px-3 text-right text-zinc-900">{p.count}</td>
                          <td className="py-3 px-3 text-right text-green-600">{formatPrice(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )
    }

    if (type === "daily-revenue") {
      const chartData = Array.isArray(data) ? data : []
      if (chartData.length === 0) return <p className="text-zinc-500 text-center py-8">No data for this period</p>
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, color: "#18181b" }} />
            <Legend />
            <Bar dataKey="revenue" name="Revenue (Rs.)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="bookings" name="Bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (type === "payment-breakdown") {
      const chartData = Array.isArray(data) ? data : []
      if (chartData.length === 0) return <p className="text-zinc-500 text-center py-8">No data for this period</p>
      const pieData = chartData.map((d: any) => ({ name: d._id || "Unknown", value: d.revenue, bookings: d.bookings }))
      return (
        <div className="space-y-6">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={120} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_: any, idx: number) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatPrice(value)} contentStyle={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 8, color: "#18181b" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 px-3 text-zinc-500 font-medium">Payment Method</th>
                  <th className="text-right py-3 px-3 text-zinc-500 font-medium">Revenue</th>
                  <th className="text-right py-3 px-3 text-zinc-500 font-medium">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-zinc-200/50 hover:bg-zinc-50">
                    <td className="py-3 px-3 text-zinc-900 font-medium capitalize">{row._id || "Unknown"}</td>
                    <td className="py-3 px-3 text-right text-green-600">{formatPrice(row.revenue)}</td>
                    <td className="py-3 px-3 text-right text-zinc-900">{row.bookings.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <CounterLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Counter Finance</h1>
            <p className="text-zinc-500 text-sm mt-1">Your earnings, commissions, and revenue breakdown</p>
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

        {type !== "overview" && (
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
        )}

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
              {type !== "overview" && (
                <CardDescription>{from} to {to}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>
        )}
      </div>
    </CounterLayout>
  )
}
