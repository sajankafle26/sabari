import { NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}, 60000)

export function rateLimit({
  windowMs = 60000,
  max = 60,
  keyFn,
}: {
  windowMs?: number
  max?: number
  keyFn?: (request: Request) => string
} = {}) {
  return (request: Request): NextResponse | null => {
    const key = keyFn
      ? keyFn(request)
      : request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "anonymous"

    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return null
    }

    entry.count++

    if (entry.count > max) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
          },
        }
      )
    }

    return null
  }
}
