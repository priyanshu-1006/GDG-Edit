/**
 * Chat Response Cache Middleware
 * Caches responses for identical queries to reduce API costs
 */

import crypto from "crypto";

// In-memory cache (use Redis in production)
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500; // Maximum cached entries

// Generate cache key from message
const generateCacheKey = (message) => {
  const normalized = message.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("md5").update(normalized).digest("hex");
};

// Cleanup old cache entries
const cleanupCache = () => {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      deletedCount++;
    }
  }

  // If still too large, remove oldest entries
  if (responseCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => responseCache.delete(key));
  }

  if (deletedCount > 0 && process.env.NODE_ENV === "development") {
    console.log(`🧹 Cache cleanup: removed ${deletedCount} entries`);
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupCache, 5 * 60 * 1000);

export const chatCache = (req, res, next) => {
  const { message, sessionId } = req.body;

  // Don't cache if session-specific context might affect response
  // Only cache for generic questions without session history
  if (sessionId) {
    return next();
  }

  const cacheKey = generateCacheKey(message);
  const cached = responseCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Cache hit
    res.setHeader("X-Cache", "HIT");
    res.setHeader(
      "X-Cache-Age",
      Math.floor((Date.now() - cached.timestamp) / 1000),
    );

    return res.json({
      success: true,
      response: cached.response,
      cached: true,
      context: cached.context || [],
    });
  }

  // Cache miss - intercept response to cache it
  res.setHeader("X-Cache", "MISS");

  const originalJson = res.json.bind(res);
  res.json = (data) => {
    // Only cache successful responses
    if (data.success && data.response && !data.cached) {
      responseCache.set(cacheKey, {
        response: data.response,
        context: data.context || [],
        timestamp: Date.now(),
      });

      if (process.env.NODE_ENV === "development") {
        console.log(`💾 Cached response for: "${message.slice(0, 50)}..."`);
      }
    }

    return originalJson(data);
  };

  next();
};

// Utility to clear cache (for admin use)
export const clearChatCache = () => {
  const size = responseCache.size;
  responseCache.clear();
  return size;
};

// Get cache stats
export const getCacheStats = () => ({
  size: responseCache.size,
  maxSize: MAX_CACHE_SIZE,
  ttlMinutes: CACHE_TTL / 60000,
});

export default chatCache;
