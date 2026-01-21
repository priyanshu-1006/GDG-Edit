/**
 * Embedding Cache Utility
 * Caches embeddings to reduce API calls to Nomic
 */

import crypto from "crypto";

// In-memory cache for embeddings
const embeddingCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;

// Common queries to precompute
const COMMON_QUERIES = [
  "upcoming events",
  "what are the upcoming events",
  "who is the lead",
  "who is the organizer",
  "who is the gdg lead",
  "how to join gdg",
  "how can i join",
  "contact information",
  "how to contact",
  "what is gdg mmmut",
  "about gdg",
  "tell me about gdg",
  "team members",
  "who are the leads",
  "hackathon",
  "techsprint",
  "study jam",
  "web development lead",
  "ai ml lead",
  "android lead",
];

// Generate cache key
const generateKey = (text) => {
  const normalized = text.toLowerCase().trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
};

/**
 * Get embedding from cache or generate new one
 * @param {string} text - Text to embed
 * @param {Function} embedFunction - Function to generate embedding if not cached
 * @returns {Promise<number[]>} - Embedding vector
 */
export const getCachedEmbedding = async (text, embedFunction) => {
  const cacheKey = generateKey(text);

  // Check cache
  const cached = embeddingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.embedding;
  }

  // Generate new embedding
  const embedding = await embedFunction(text);

  // Cache it
  embeddingCache.set(cacheKey, {
    embedding,
    timestamp: Date.now(),
  });

  // Cleanup if too large
  if (embeddingCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(embeddingCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    toRemove.forEach(([key]) => embeddingCache.delete(key));
  }

  return embedding;
};

/**
 * Precompute embeddings for common queries
 * Call this on server startup
 * @param {Function} embedFunction - Function to generate embeddings
 */
export const precomputeCommonEmbeddings = async (embedFunction) => {
  console.log("🔄 Precomputing embeddings for common queries...");
  let cached = 0;

  for (const query of COMMON_QUERIES) {
    try {
      await getCachedEmbedding(query, embedFunction);
      cached++;
    } catch (error) {
      console.error(
        `Failed to precompute embedding for "${query}":`,
        error.message,
      );
    }
  }

  console.log(`✅ Precomputed ${cached}/${COMMON_QUERIES.length} embeddings`);
};

/**
 * Get cache statistics
 */
export const getEmbeddingCacheStats = () => ({
  size: embeddingCache.size,
  maxSize: MAX_CACHE_SIZE,
  ttlMinutes: CACHE_TTL / 60000,
  commonQueriesCount: COMMON_QUERIES.length,
});

/**
 * Clear embedding cache
 */
export const clearEmbeddingCache = () => {
  const size = embeddingCache.size;
  embeddingCache.clear();
  return size;
};

export default {
  getCachedEmbedding,
  precomputeCommonEmbeddings,
  getEmbeddingCacheStats,
  clearEmbeddingCache,
  COMMON_QUERIES,
};
