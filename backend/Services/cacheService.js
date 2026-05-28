import Redis from "ioredis"
import dotenv from "dotenv"

dotenv.config()

const REDIS_URL = process.env.REDIS_URL
let redis = null

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL)
    redis.on("error", (err) => {
      console.warn("[Redis] Error:", err.message)
    })
    console.log("[Redis] Connected 🚀")
  } catch (err) {
    console.error("[Redis] Connection failed:", err.message)
  }
} else {
  console.warn("[Redis] REDIS_URL not found in .env. Caching disabled.")
}

export const getCache = async (key) => {
  if (!redis) return null
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.error(`[Redis] Get error for ${key}:`, err.message)
    return null
  }
}

export const setCache = async (key, value, ttlSeconds = 3600) => {
  if (!redis) return null
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch (err) {
    console.error(`[Redis] Set error for ${key}:`, err.message)
  }
}

export const delCache = async (key) => {
  if (!redis) return null
  try {
    await redis.del(key)
  } catch (err) {
    console.error(`[Redis] Delete error for ${key}:`, err.message)
  }
}

export default { getCache, setCache, delCache }
