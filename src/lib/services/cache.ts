let client: any = null
let connected = false

function getRedisUrl(): string {
  return process.env.REDIS_URL || process.env.REDIS_HOST
    ? `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`
    : ""
}

export async function getRedisClient() {
  if (client && connected) return client

  const url = getRedisUrl()
  if (!url) return null

  try {
    const redis = await import("redis")
    client = redis.default?.createClient?.({ url }) || redis.createClient?.({ url })
    client.on("error", () => { connected = false })
    client.on("connect", () => { connected = true })
    await client.connect()
    connected = true
    return client
  } catch {
    return null
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedisClient()
    if (!redis) return null
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: any, ttl = 300): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (!redis) return
    await redis.set(key, JSON.stringify(value), { EX: ttl })
  } catch {
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (!redis) return
    await redis.del(key)
  } catch {
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    if (!redis) return
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(keys)
  } catch {
  }
}

export async function getOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = 300
): Promise<T> {
  const cached = await cacheGet<T>(key)
  if (cached !== null) return cached

  const value = await fetchFn()
  await cacheSet(key, value, ttl)
  return value
}
