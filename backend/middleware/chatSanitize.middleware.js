/**
 * Chat Input Sanitization Middleware
 * Validates and sanitizes user messages before processing
 */

export const sanitizeChatInput = (req, res, next) => {
  const { message } = req.body;

  // Validate message exists and is a string
  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      message: "Message is required and must be a string",
    });
  }

  // Trim whitespace
  const trimmedMessage = message.trim();

  // Check for empty message after trim
  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Message cannot be empty",
    });
  }

  // Limit message length (max 1000 characters)
  if (trimmedMessage.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Message too long (max 1000 characters)",
    });
  }

  // Sanitize message - remove potential injection attempts
  req.body.message = trimmedMessage
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\[INST\]|\[\/INST\]/gi, "") // Remove LLaMA prompt injection attempts
    .replace(/<<SYS>>|<\/SYS>>/gi, "") // Remove system prompt injection
    .replace(/\{\{[^}]*\}\}/g, "") // Remove template injection attempts
    .replace(/\$\{[^}]*\}/g, "") // Remove JS template literal injection
    .trim();

  // Validate sessionId if provided
  if (req.body.sessionId && typeof req.body.sessionId !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid session ID format",
    });
  }

  next();
};

export default sanitizeChatInput;
