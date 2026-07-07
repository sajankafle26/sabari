"use client"

import { useEffect, useState } from "react"
import { Calendar } from "lucide-react"
import { todayNepali } from "@/lib/nepali-date"

export function NepaliDateBanner() {
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    setDateStr(todayNepali())
  }, [])

  if (!dateStr) return null

  return (
    <div className="bg-gradient-to-r from-violet-900/50 via-zinc-900 to-cyan-900/50 border-b border-violet-800/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs text-zinc-400">
          <span className="text-violet-300 font-medium">Nepali Date:</span> {dateStr}
        </span>
      </div>
    </div>
  )
}
