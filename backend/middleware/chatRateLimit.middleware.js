/**
 * Chat Rate Limiting Middleware
 * Prevents API abuse and controls costs
 */

import rateLimit from "express-rate-limit";

// Standard rate limiter for chat endpoint
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 15, // 15 requests per minute per IP
  message: {
    success: false,
    message: "Too many requests. Please wait a moment before asking again.",
    retryAfter: 60,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please wait a moment before asking again.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?._id?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user?.role === "super_admin";
  },
});

// Stricter rate limiter for unauthenticated users
export const strictChatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // 5 requests per minute for unauthenticated
  message: {
    success: false,
    message: "Rate limit exceeded. Sign in for higher limits.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip if user is authenticated
    return !!req.user;
  },
});

// Daily limit to prevent excessive usage
export const dailyChatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 200, // 200 requests per day
  message: {
    success: false,
    message: "Daily limit reached. Please try again tomorrow.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  },
});

export default chatRateLimiter;
