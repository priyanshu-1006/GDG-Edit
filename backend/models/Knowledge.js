import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: [
        "PDF",
        "JSON",
        "Manual",
        "Website Data",
        "Events",
        "Core Team",
        "FAQ",
      ],
    },
    embedding: {
      type: [Number],
      required: true,
      index: false, // We'll do manual vector search or specialized index later if needed
    },
    hash: {
      type: String,
      required: true,
      unique: true, // Prevents duplicate content
    },
    // New metadata fields for enhanced retrieval
    category: {
      type: String,
      enum: [
        "event",
        "team",
        "about",
        "technical",
        "faq",
        "contact",
        "leadership",
        "general",
      ],
      default: "general",
    },
    importance: {
      type: String,
      enum: ["high", "normal", "low"],
      default: "normal",
    },
    keywords: {
      type: [String],
      default: [],
    },
    dateRelevance: {
      type: String,
      enum: ["current", "past", "future", "timeless"],
      default: "timeless",
    },
    academicYear: {
      type: String, // e.g., "2025-26"
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Create an index for text search
knowledgeSchema.index({ text: "text", title: "text" });

// Index for category-based queries
knowledgeSchema.index({ category: 1, importance: -1 });

// Index for source filtering
knowledgeSchema.index({ source: 1 });

const Knowledge = mongoose.model("Knowledge", knowledgeSchema);

export default Knowledge;
