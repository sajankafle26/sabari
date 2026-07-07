"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2, Trash2, Filter, PieChart as PieChartIcon, IndianRupee, Fuel, Wrench, Users } from "lucide-react"
import { CompanyLayout } from "@/components/company/company-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatPrice, formatDate } from "@/lib/utils"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import api from "@/lib/api"
import { toast } from "sonner"

const expenseTypes = [
  { id: "fuel", label: "Fuel", icon: Fuel },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "salary", label: "Salary", icon: Users },
  { id: "toll", label: "Toll", icon: IndianRupee },
  { id: "parking", label: "Parking", icon: IndianRupee },
  { id: "food", label: "Food", icon: IndianRupee },
  { id: "other", label: "Other", icon: IndianRupee },
]

const COLORS = ["#7c3aed", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#ec4899"]

interface ExpenseItem {
  _id: string
  type: string
  amount: number
  description: string
  date: string
  vehicle?: { vehicleNumber: string }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [summary, setSummary] = useState<Array<{ _id: string; total: number; count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (typeFilter !== "all") params.type = typeFilter
      if (search) params.search = search
      const { data } = await api.get("/api/company/expenses", { params })
      setExpenses(data.expenses || [])
      setSummary(data.summary || [])
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchExpenses() }, [page, typeFilter])

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return
    try {
      await api.delete(`/api/company/expenses/${id}`)
      toast.success("Expense deleted")
      fetchExpenses()
    } catch {
      toast.error("Failed to delete")
    }
  }

  const totalExpenses = summary.reduce((sum, s) => sum + s.total, 0)

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Expenses</h1>
            <p className="text-zinc-500 text-sm mt-1">Track and manage your business expenses</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {summary.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.map((s) => {
              const t = expenseTypes.find((e) => e.id === s._id)
              const Icon = t?.icon || IndianRupee
              return (
                <Card key={s._id} className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-100">
                      <Icon className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">{t?.label || s._id}</p>
                      <p className="text-sm font-semibold text-zinc-900">{formatPrice(s.total)}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-600/20">
                  <IndianRupee className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Total</p>
                  <p className="text-sm font-semibold text-zinc-900">{formatPrice(totalExpenses)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {summary.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <PieChartIcon className="h-4 w-4 text-violet-600" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={summary.map((s) => ({ name: s._id, value: s.total }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(entry: any) => `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`}>
                    {summary.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#e4e4e7" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", ...expenseTypes.map((e) => e.id)].map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(1) }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  typeFilter === t ? "bg-violet-600/20 text-violet-600" : "bg-zinc-50 text-zinc-500 hover:text-zinc-900"
                )}
              >
                {t === "all" ? "All" : expenseTypes.find((e) => e.id === t)?.label || t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : expenses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <IndianRupee className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-zinc-500">No expenses recorded</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => {
              const t = expenseTypes.find((e) => e.id === exp.type)
              const Icon = t?.icon || IndianRupee
              return (
                <Card key={exp._id}>
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-100 shrink-0">
                        <Icon className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">{t?.label || exp.type}</p>
                        <p className="text-xs text-zinc-500">{exp.description || "No description"}</p>
                        <div className="flex gap-3 text-xs text-zinc-600 mt-0.5">
                          <span>{formatDate(exp.date)}</span>
                          {exp.vehicle?.vehicleNumber && <span>{exp.vehicle.vehicleNumber}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-zinc-900">{formatPrice(exp.amount)}</span>
                      <button onClick={() => handleDelete(exp._id)} className="p-1 text-zinc-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p} onClick={() => setPage(p)}
                className={cn("px-3 py-1.5 rounded-lg text-sm transition-colors", page === p ? "bg-violet-600 text-zinc-900" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {showCreate && (
          <CreateExpenseModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchExpenses() }} />
        )}
      </div>
    </CompanyLayout>
  )
}

function CreateExpenseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ type: "fuel", amount: "", description: "", date: new Date().toISOString().split("T")[0], vehicle: "" })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      toast.error("Amount and description are required")
      return
    }

    setSubmitting(true)
    try {
      const payload: any = { type: form.type, amount: Number(form.amount), description: form.description, date: form.date }
      if (form.vehicle) payload.vehicle = form.vehicle

      await api.post("/api/company/expenses", payload)
      toast.success("Expense recorded")
      onCreated()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to record expense")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Add Expense</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {expenseTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <Input type="number" label="Amount (Rs.)" placeholder="1000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Input label="Description" placeholder="What was this expense for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input type="date" label="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSubmit} loading={submitting}>Save</Button>
        </div>
      </div>
    </div>
  )
}
