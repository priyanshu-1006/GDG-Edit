/**
 * Chat Request Logging Middleware
 * Logs chat requests for analytics and debugging
 */

const anonymizeIp = (ip) => {
  if (!ip || typeof ip !== "string") return null;

  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.x.x`;
    }
  }

  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    if (parts.length > 2) {
      return `${parts.slice(0, 2).join(":")}:xxxx`;
    }
  }

  return ip;
};

const maskIdentifier = (value) => {
  if (!value || typeof value !== "string") return null;
  if (value.length <= 8) return "[REDACTED]";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

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
      messageLength: req.body.message?.length || 0,
      sessionId: maskIdentifier(req.body.sessionId),
      userId: req.user?._id || null,
      userRole: req.user?.role || "anonymous",
      ip: anonymizeIp(req.ip),
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
