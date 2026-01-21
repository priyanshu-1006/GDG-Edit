/**
 * Chat Request Logging Middleware
 * Logs chat requests for analytics and debugging
 */

export const logChatRequest = (req, res, next) => {
  const startTime = Date.now();
  const requestId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Attach request ID for tracking
  req.chatRequestId = requestId;

  // Log on response finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      type: "chat_request",
      message: req.body.message?.slice(0, 100), // First 100 chars only
      messageLength: req.body.message?.length || 0,
      sessionId: req.body.sessionId || null,
      userId: req.user?._id || null,
      userRole: req.user?.role || "anonymous",
      ip: req.ip,
      responseTime: duration,
      statusCode: res.statusCode,
      cached: res.getHeader("X-Cache") === "HIT",
    };

    // Log to console (in production, send to logging service)
    if (process.env.NODE_ENV === "development") {
      console.log("📝 Chat Log:", JSON.stringify(logEntry, null, 2));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  });

  next();
};

export default logChatRequest;
