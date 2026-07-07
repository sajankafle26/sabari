"use client"

import { useState, useEffect, useCallback } from "react"
import { Shield, Search, Filter, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { AdminLayout } from "@/components/admin/admin-layout"

interface AuditLog {
  _id: string
  user: { _id: string; name: string; email: string; role: string } | null
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ip?: string
  userAgent?: string
  createdAt: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({ action: "", resource: "", userId: "" })
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" })
      if (filters.action) params.set("action", filters.action)
      if (filters.resource) params.set("resource", filters.resource)
      if (filters.userId) params.set("userId", filters.userId)

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setLogs(data.logs)
      setTotalPages(data.pagination.totalPages)
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-50">
              <Shield className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Audit Logs</h1>
              <p className="text-sm text-zinc-500">Track all activities across the system</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors text-sm"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-white/50 border border-zinc-200">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Action</label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1) }}
                placeholder="e.g. login, booking, payment..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Resource</label>
              <input
                type="text"
                value={filters.resource}
                onChange={(e) => { setFilters(f => ({ ...f, resource: e.target.value })); setPage(1) }}
                placeholder="e.g. user, booking, payment..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => { setFilters(f => ({ ...f, userId: e.target.value })); setPage(1) }}
                placeholder="MongoDB User ID..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-100 border border-zinc-300 text-zinc-900 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Shield className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No audit logs found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-white/50">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Time</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Resource</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">IP</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="border-b border-zinc-200 hover:bg-white/50 transition-colors">
                    <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <div>
                          <p className="text-zinc-900">{log.user.name || "Unknown"}</p>
                          <p className="text-xs text-zinc-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-zinc-500">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {log.resource}
                      {log.resourceId && (
                        <p className="text-xs text-zinc-500 font-mono">{log.resourceId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs">
                      {log.ip || "-"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">
                      {log.details ? JSON.stringify(log.details).slice(0, 80) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-zinc-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-zinc-100 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
