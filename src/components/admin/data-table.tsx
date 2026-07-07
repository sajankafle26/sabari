"use client"

import { Pencil, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  loading?: boolean
}

export function DataTable({ columns, data, onEdit, onDelete, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-white border border-zinc-200">
        <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-white border border-zinc-200">
        <p className="text-zinc-500 text-sm">No data found</p>
      </div>
    )
  }

  const hasActions = onEdit || onDelete

  return (
    <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-zinc-500 font-medium"
                >
                  {col.label}
                </th>
              ))}
              {hasActions && (
                <th className="text-right py-3 px-4 text-zinc-500 font-medium w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={row._id ?? row.id ?? i}
                className="border-b border-zinc-100 text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3 px-4">
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? "-"}
                  </td>
                ))}
                {hasActions && (
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-violet-600 hover:bg-zinc-100 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-zinc-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
