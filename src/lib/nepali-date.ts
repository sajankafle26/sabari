import NepaliDate from "nepali-datetime"

export function toNepaliDate(adDate: string | Date | null | undefined): string {
  if (!adDate) return "—"
  const d = typeof adDate === "string" ? new Date(adDate) : adDate
  try {
    const nd = NepaliDate.parseEnglishDate(d.toISOString().split("T")[0], "YYYY-MM-DD")
    return nd ? nd.format("YYYY-MM-DD") : "—"
  } catch {
    return "—"
  }
}

export function toNepaliFull(adDate: string | Date | null | undefined): string {
  if (!adDate) return "—"
  const d = typeof adDate === "string" ? new Date(adDate) : adDate
  try {
    const nd = NepaliDate.parseEnglishDate(d.toISOString().split("T")[0], "YYYY-MM-DD")
    return nd ? nd.format("dddd, MMMM D, YYYY") : "—"
  } catch {
    return "—"
  }
}

export function toNepaliShort(adDate: string | Date | null | undefined): string {
  if (!adDate) return "—"
  const d = typeof adDate === "string" ? new Date(adDate) : adDate
  try {
    const nd = NepaliDate.parseEnglishDate(d.toISOString().split("T")[0], "YYYY-MM-DD")
    return nd ? nd.format("MMM D, YYYY") : "—"
  } catch {
    return "—"
  }
}

export function todayNepali(): string {
  try {
    const now = new Date()
    const nd = NepaliDate.parseEnglishDate(now.toISOString().split("T")[0], "YYYY-MM-DD")
    return nd ? nd.format("dddd, MMMM D, YYYY") : "—"
  } catch {
    return "—"
  }
}
