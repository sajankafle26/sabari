import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("ne-NP")}`
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateNepali(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date
    const NepaliDate = require("nepali-datetime").default
    const nd = NepaliDate.parseEnglishDate(d.toISOString().split("T")[0], "YYYY-MM-DD")
    if (!nd) return formatDate(date)
    return `${nd.format("YYYY-MM-DD")} BS`
  } catch {
    return formatDate(date)
  }
}

export function formatDateWithNepali(date: Date | string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date
    const ad = formatDate(date)
    const NepaliDate = require("nepali-datetime").default
    const nd = NepaliDate.parseEnglishDate(d.toISOString().split("T")[0], "YYYY-MM-DD")
    if (!nd) return ad
    return `${ad} (${nd.format("MMM D, YYYY")} BS)`
  } catch {
    return formatDate(date)
  }
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
