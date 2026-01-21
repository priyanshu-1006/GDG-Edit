import express from "express";
import {
  chat,
  getChatHistory,
  submitFeedback,
} from "../controllers/chatController.js";
import { chatRateLimiter } from "../middleware/chatRateLimit.middleware.js";
import { sanitizeChatInput } from "../middleware/chatSanitize.middleware.js";
import { chatCache } from "../middleware/chatCache.middleware.js";
import { logChatRequest } from "../middleware/chatLog.middleware.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/chat
 * Main chat endpoint with all middleware applied
 *
 * Middleware stack:
 * 1. optionalAuth - Attach user if authenticated (for rate limit adjustments)
 * 2. chatRateLimiter - Rate limiting (15/min standard, 5/min anonymous)
 * 3. sanitizeChatInput - Input validation and sanitization
 * 4. chatCache - Response caching (skipped if sessionId provided)
 * 5. logChatRequest - Request logging
 * 6. chat - Main handler
 */
router.post(
  "/",
  optionalAuth,
  chatRateLimiter,
  sanitizeChatInput,
  chatCache,
  logChatRequest,
  chat,
);

/**
 * GET /api/chat/history/:sessionId
 * Get chat history for a session
 */
router.get("/history/:sessionId", getChatHistory);

/**
 * POST /api/chat/feedback
 * Submit feedback for a chat response
 */
router.post("/feedback", optionalAuth, submitFeedback);

export default router;
