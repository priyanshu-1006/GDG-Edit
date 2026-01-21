/**
 * ChatSession Model
 * Stores conversation history for context-aware chat
 */

import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      userAgent: String,
      ip: String,
      queryCount: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// TTL Index - auto-delete after 24 hours of inactivity
chatSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

// Method to add a message and update activity
chatSessionSchema.methods.addMessage = function (role, content) {
  this.messages.push({ role, content, timestamp: new Date() });

  // Keep only last 20 messages (10 exchanges)
  if (this.messages.length > 20) {
    this.messages = this.messages.slice(-20);
  }

  this.lastActivity = new Date();
  this.metadata.queryCount += role === "user" ? 1 : 0;

  return this.save();
};

// Method to get conversation history for LLM
chatSessionSchema.methods.getHistoryForLLM = function (limit = 10) {
  const recentMessages = this.messages.slice(-limit);
  return recentMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
};

// Static method to find or create session
chatSessionSchema.statics.findOrCreateSession = async function (
  sessionId,
  userId = null,
  metadata = {},
) {
  let session = await this.findOne({ sessionId });

  if (!session) {
    session = await this.create({
      sessionId,
      userId,
      messages: [],
      metadata: {
        ...metadata,
        queryCount: 0,
      },
    });
  } else {
    // Update last activity
    session.lastActivity = new Date();
    if (userId && !session.userId) {
      session.userId = userId;
    }
    await session.save();
  }

  return session;
};

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
