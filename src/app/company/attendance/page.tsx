"use client"

import { useState, useEffect } from "react"
import {
  Clock,
  LogIn,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { CompanyLayout } from "@/components/company/company-layout"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AttendanceRecord {
  _id: string
  user: { _id: string; firstName: string; lastName: string; email: string; phone: string; role: string }
  date: string
  clockIn: string
  clockOut: string
  status: string
  workDuration: number
  note: string
}

function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [todayStatus, setTodayStatus] = useState<any>(null)
  const [clocking, setClocking] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchDate, setSearchDate] = useState("")

  const fetchRecords = () => {
    const params = new URLSearchParams({ page: String(page), limit: "20" })
    if (searchDate) params.set("date", searchDate)
    api.get(`/company/attendance?${params}`)
      .then(res => {
        setRecords(res.data.records || [])
        setTotalPages(res.data.pagination?.pages || 1)
      })
      .catch(() => toast.error("Failed to load attendance"))
      .finally(() => setLoading(false))
  }

  const fetchToday = () => {
    api.get("/company/attendance/today")
      .then(res => setTodayStatus(res.data))
      .catch(() => {})
  }

  useEffect(() => { fetchRecords() }, [page, searchDate])
  useEffect(() => { fetchToday() }, [])

  const handleClock = async (type: "clockin" | "clockout") => {
    setClocking(true)
    try {
      await api.post("/company/attendance", { type })
      toast.success(type === "clockin" ? "Clocked in!" : "Clocked out!")
      fetchToday()
      fetchRecords()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${type}`)
    } finally {
      setClocking(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "late": return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "absent": return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-zinc-500" />
    }
  }

  return (
    <CompanyLayout>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Attendance</h1>

        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-violet-600" />
              <div>
                <p className="text-sm text-zinc-500">Today's Status</p>
                <p className="text-lg font-semibold text-zinc-900">
                  {todayStatus === null ? "Loading..." : todayStatus.checkedIn ? "Clocked In" : "Not Clocked In"}
                </p>
                {todayStatus?.checkedIn && (
                  <p className="text-xs text-zinc-500">
                    {todayStatus.checkedOut ? `Clocked out: ${new Date(todayStatus.clockOutTime).toLocaleTimeString()}` : `Duration: ${formatDuration(todayStatus.workDuration)}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!todayStatus?.checkedIn && (
                <Button variant="primary" size="sm" className="gap-1.5" onClick={() => handleClock("clockin")} disabled={clocking}>
                  {clocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Clock In
                </Button>
              )}
              {todayStatus?.checkedIn && !todayStatus?.checkedOut && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleClock("clockout")} disabled={clocking}>
                  {clocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Clock Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => { setSearchDate(e.target.value); setPage(1) }}
            className="max-w-48"
          />
          {searchDate && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchDate(""); setPage(1) }}>Clear</Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 text-violet-600 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">No attendance records found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/80">
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Staff</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Clock In</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Clock Out</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Duration</th>
                    <th className="text-left px-4 py-3 text-zinc-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {records.map((r) => (
                    <tr key={r._id} className="hover:bg-white/40">
                      <td className="px-4 py-3">
                        <p className="text-zinc-200 font-medium">{r.user?.firstName} {r.user?.lastName}</p>
                        <p className="text-xs text-zinc-500">{r.user?.role?.replace(/_/g, " ")}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : "—"}</td>
                      <td className="px-4 py-3 text-zinc-700">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : "—"}</td>
                      <td className="px-4 py-3 text-zinc-700">{formatDuration(r.workDuration)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5">
                          {statusIcon(r.status)}
                          <span className="capitalize text-zinc-700">{r.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-zinc-500">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </div>
    </CompanyLayout>
  )
}

export default AttendancePage
