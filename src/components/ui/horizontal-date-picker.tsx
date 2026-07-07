"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import NepaliDate from "nepali-datetime"

const BS_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const BS_DAYS_NP = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"]

function getNepaliDayNum(day: number): string {
  const nums = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]
  return String(day).split("").map(d => nums[parseInt(d)]).join("")
}

interface HorizontalDatePickerProps {
  value: string
  onChange: (adDate: string) => void
  days?: number
}

export function HorizontalDatePicker({ value, onChange, days = 7 }: HorizontalDatePickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollIdx, setScrollIdx] = useState(0)

  const today = new Date()
  const dates: Array<{ ad: string; bsDay: number; bsMonthNum: number; bsYear: number; weekday: number }> = []

  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const adStr = d.toISOString().split("T")[0]
    const nd = NepaliDate.parseEnglishDate(adStr, "YYYY-MM-DD")
    if (nd) {
      const parts = nd.format("YYYY-MM-DD").split("-")
      dates.push({
        ad: adStr,
        bsDay: parseInt(parts[2]),
        bsMonthNum: parseInt(parts[1]),
        bsYear: parseInt(parts[0]),
        weekday: d.getDay(),
      })
    }
  }

  const scroll = (dir: number) => {
    if (scrollRef.current) {
      const newIdx = Math.max(0, Math.min(scrollIdx + dir, dates.length - days))
      setScrollIdx(newIdx)
      scrollRef.current.scrollTo({ left: newIdx * 80, behavior: "smooth" })
    }
  }

  return (
    <div className="relative flex items-center gap-1">
      <button
        onClick={() => scroll(-1)}
        className="shrink-0 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div ref={scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory" style={{ scrollBehavior: "smooth" }}>
        {dates.map((d) => {
          const isSelected = d.ad === value
          return (
            <button
              key={d.ad}
              onClick={() => onChange(d.ad)}
              className={`snap-center shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                isSelected
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              <span className={`text-[10px] font-medium uppercase ${isSelected ? "text-white/80" : "text-zinc-400"}`}>
                {BS_DAYS[d.weekday]}
              </span>
              <span className="text-lg font-bold leading-tight">{d.bsDay}</span>
              <span className={`text-[10px] font-medium ${isSelected ? "text-white/80" : "text-violet-500"}`}>
                {getNepaliDayNum(d.bsDay)}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => scroll(1)}
        className="shrink-0 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
