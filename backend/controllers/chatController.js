/**
 * Enhanced Chat Controller
 * Features:
 * - Conversation memory with session management
 * - Query classification for specialized handling
 * - Embedding caching
 * - Dynamic temporal context
 * - Hybrid search support
 * - Improved system prompt
 */

import axios from "axios";
import Knowledge from "../models/Knowledge.js";
import ChatSession from "../models/ChatSession.js";
import Event from "../models/Event.js";
import CoreTeamMember from "../models/CoreTeamMember.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { getCachedEmbedding } from "../utils/embeddingCache.js";

dotenv.config();

const NOMIC_API_KEY = process.env.NOMIC_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY || "dummy" });

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get embedding from Nomic API
 */
const getNomicEmbedding = async (text) => {
  try {
    const response = await axios.post(
      "https://api-atlas.nomic.ai/v1/embedding/text",
      {
        model: "nomic-embed-text-v1.5",
        texts: [text],
        task_type: "search_query",
      },
      {
        headers: {
          Authorization: `Bearer ${NOMIC_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data.embeddings[0];
  } catch (error) {
    console.error("Embedding Error:", error.message);
    throw new Error("Failed to generate embedding");
  }
};

/**
 * Calculate cosine similarity between two vectors
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Get current academic term dynamically
 */
const getCurrentAcademicTerm = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Academic year: July to June
  if (month >= 7) return `${year}-${(year + 1).toString().slice(-2)}`;
  return `${year - 1}-${year.toString().slice(-2)}`;
};

/**
 * Classify query type for specialized handling
 */
const classifyQuery = (message) => {
  const lower = message.toLowerCase();

  if (/upcoming|next|future|schedule|when is/i.test(lower))
    return "events_upcoming";
  if (/past|previous|last|happened|history/i.test(lower)) return "events_past";
  if (/who is|lead|organizer|team member|head of|in charge/i.test(lower))
    return "team";
  if (/contact|email|reach|phone|instagram|linkedin|social/i.test(lower))
    return "contact";
  if (/join|register|apply|membership|become|part of/i.test(lower))
    return "membership";
  if (/what is gdg|about gdg|explain gdg|tell me about gdg/i.test(lower))
    return "about";
  if (/hackathon|techsprint|hackblitz|coding|competition/i.test(lower))
    return "hackathon";
  if (/study jam|cloud|google cloud|qwiklab/i.test(lower)) return "studyjam";
  if (/workshop|session|learn|tutorial/i.test(lower)) return "workshop";

  return "general";
};

/**
 * Get specialized context based on query type
 */
const getSpecializedContext = async (queryType) => {
  let additionalContext = "";

  try {
    switch (queryType) {
      case "events_upcoming": {
        const upcomingEvents = await Event.find({
          date: { $gte: new Date() },
          published: true,
        })
          .sort({ date: 1 })
          .limit(5)
          .lean();

        if (upcomingEvents.length > 0) {
          additionalContext =
            "\n\n### LIVE DATA: Upcoming Events from Database\n" +
            upcomingEvents
              .map(
                (e) =>
                  `- **${e.name}** (${e.type}): ${new Date(e.date).toLocaleDateString("en-IN")} at ${e.location}`,
              )
              .join("\n");
        }
        break;
      }

      case "team": {
        const coreTeam = await CoreTeamMember.find({ visible: true })
          .sort({ order: 1 })
          .lean();

        if (coreTeam.length > 0) {
          additionalContext =
            "\n\n### LIVE DATA: Current Core Team Members\n" +
            coreTeam
              .map(
                (m) =>
                  `- **${m.name}**: ${m.role} (${m.position || m.badge || ""})`,
              )
              .join("\n");
        }
        break;
      }

      case "events_past": {
        const pastEvents = await Event.find({
          date: { $lt: new Date() },
          published: true,
        })
          .sort({ date: -1 })
          .limit(5)
          .lean();

        if (pastEvents.length > 0) {
          additionalContext =
            "\n\n### LIVE DATA: Recent Past Events\n" +
            pastEvents
              .map(
                (e) =>
                  `- **${e.name}** (${e.type}): ${new Date(e.date).toLocaleDateString("en-IN")}`,
              )
              .join("\n");
        }
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error("Error fetching specialized context:", error.message);
  }

  return additionalContext;
};

/**
 * Boost scores based on metadata and query type
 */
const boostByMetadata = (docs, queryType) => {
  return docs.map((doc) => {
    let boost = 1.0;

    // Boost high importance documents
    if (doc.importance === "high") boost *= 1.3;

    // Boost by category match
    if (
      (queryType === "team" && doc.category === "leadership") ||
      (queryType === "team" && doc.category === "team")
    ) {
      boost *= 1.4;
    }
    if (queryType.includes("events") && doc.category === "event") {
      boost *= 1.3;
    }
    if (queryType === "contact" && doc.category === "contact") {
      boost *= 1.5;
    }
    if (queryType === "membership" && doc.category === "faq") {
      boost *= 1.4;
    }

    // Boost FAQ for common questions
    if (doc.source === "FAQ") {
      boost *= 1.2;
    }

    return {
      ...doc,
      adjustedScore: (doc.score || 0) * boost,
    };
  });
};

/**
 * Perform vector search with boosting
 */
const performVectorSearch = async (queryEmbedding, queryType, limit = 10) => {
  // Load knowledge base
  const knowledgeBase = await Knowledge.find(
    {},
    { embedding: 1, text: 1, source: 1, title: 1, category: 1, importance: 1 },
  ).lean();

  // Calculate similarity scores
  const scoredDocs = knowledgeBase.map((doc) => ({
    ...doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Apply metadata boosting
  const boostedDocs = boostByMetadata(scoredDocs, queryType);

  // Sort by adjusted score
  boostedDocs.sort((a, b) => b.adjustedScore - a.adjustedScore);

  return boostedDocs.slice(0, limit);
};

/**
 * Build the system prompt with dynamic context
 */
const buildSystemPrompt = (contextText, historyText, specializedContext) => {
  const currentTerm = getCurrentAcademicTerm();
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `You are the official AI Assistant for GDG MMMUT (Google Developer Group on Campus at Madan Mohan Malaviya University of Technology).

### Your Identity
- Name: GDG Assistant
- Personality: Helpful, enthusiastic about technology, professional but friendly
- Use emojis sparingly and appropriately: ✨, 🚀, 💻, 📅, 👋

### Current Context (Auto-Updated)
- **Current Academic Term:** ${currentTerm}
- **Today's Date:** ${currentDate}

### Response Guidelines
1. **Be Concise**: Answer directly first, then provide additional details if helpful
2. **Be Accurate**: Only state facts from the provided context. Never make up events, dates, or team members
3. **Format Well**: Use **bold** for names and key terms, bullet lists for multiple items
4. **Handle Unknowns Gracefully**:
   - Say "I don't have that specific information right now"
   - Suggest: "You can check our Instagram @gdgmmmut for the latest updates"
   - Never fabricate information

### How to Handle Specific Queries
- **Team/Lead questions**: Name the person first, then their role and brief details
- **Event questions**: Include date, location, and brief description
- **Join/Membership**: Explain the recruitment process and suggest following social media
- **Follow-up questions**: Reference the conversation history below

### Knowledge Base Context
${contextText}
${specializedContext}

### Conversation History
${historyText || "No previous messages in this session."}

Remember: You represent GDG MMMUT officially. Be helpful, accurate, and enthusiastic about technology!`;
};

// ============================================
// MAIN CHAT HANDLER
// ============================================

export const chat = async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validate message (sanitization middleware handles most validation)
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Check API keys
    if (!NOMIC_API_KEY || NOMIC_API_KEY.includes("placeholder")) {
      return res.status(503).json({
        success: false,
        message: "NOMIC_API_KEY not configured",
      });
    }
    if (!GROQ_API_KEY || GROQ_API_KEY.includes("placeholder")) {
      return res.status(503).json({
        success: false,
        message: "Chatbot is currently dormant (GROQ_API_KEY not configured)",
        response:
          "The chatbot is not configured. Please contact the administrator.",
      });
    }

    // 1. Get or create session for conversation memory
    let session = null;
    let conversationHistory = [];

    if (sessionId) {
      try {
        session = await ChatSession.findOrCreateSession(
          sessionId,
          req.user?._id,
          {
            userAgent: req.headers["user-agent"],
            ip: req.ip,
          },
        );
        conversationHistory = session.getHistoryForLLM(10);
      } catch (error) {
        console.error("Session error:", error.message);
        // Continue without session if it fails
      }
    }

    // 2. Classify the query
    const queryType = classifyQuery(message);
    console.log(
      `\n🔍 Query: "${message.slice(0, 50)}..." | Type: ${queryType}`,
    );

    // 3. Get embedding (with caching)
    const queryEmbedding = await getCachedEmbedding(message, getNomicEmbedding);

    // 4. Perform vector search with metadata boosting
    const topContexts = await performVectorSearch(
      queryEmbedding,
      queryType,
      10,
    );

    // Debug: Log retrieved chunks
    console.log("📚 Top Retrieved Chunks:");
    topContexts.slice(0, 5).forEach((doc, i) => {
      console.log(
        `   ${i + 1}. [${doc.source}] ${doc.title?.slice(0, 40)}... (Score: ${doc.adjustedScore?.toFixed(4) || doc.score?.toFixed(4)})`,
      );
    });

    // 5. Get specialized context based on query type
    const specializedContext = await getSpecializedContext(queryType);

    // 6. Build context text
    const contextText = topContexts
      .map((doc) => `[${doc.source}: ${doc.title}]\n${doc.text}`)
      .join("\n\n");

    // 7. Build conversation history text
    const historyText =
      conversationHistory.length > 0
        ? conversationHistory
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
            )
            .join("\n")
        : "";

    // 8. Build system prompt
    const systemPrompt = buildSystemPrompt(
      contextText,
      historyText,
      specializedContext,
    );

    // 9. Call Groq LLM
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    // 10. Save to session history
    if (session) {
      try {
        await session.addMessage("user", message);
        await session.addMessage("assistant", aiResponse);
      } catch (error) {
        console.error("Failed to save to session:", error.message);
      }
    }

    // 11. Return response
    res.json({
      success: true,
      response: aiResponse,
      context: topContexts.map((c) => ({
        title: c.title,
        source: c.source,
        score: c.adjustedScore || c.score,
      })),
      sessionId: sessionId || null,
      queryType,
    });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process your message. Please try again.",
    });
  }
};

/**
 * Get chat session history
 */
export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    res.json({
      success: true,
      messages: session.messages,
      queryCount: session.metadata.queryCount,
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve chat history",
    });
  }
};

/**
 * Submit feedback for a chat response
 */
export const submitFeedback = async (req, res) => {
  try {
    const { messageId, feedback, sessionId } = req.body;

    // Log feedback (in production, save to database)
    console.log("📊 Chat Feedback:", {
      messageId,
      feedback,
      sessionId,
      userId: req.user?._id,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Thank you for your feedback!",
    });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

export default { chat, getChatHistory, submitFeedback };
