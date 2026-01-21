/**
 * Knowledge Base Cleanup Script
 *
 * This script performs the following operations:
 * 1. Removes invalid/malformed entries
 * 2. Removes duplicate entries
 * 3. Updates existing entries with proper metadata
 * 4. Adds FAQ entries for common questions
 *
 * Usage: node scripts/cleanupKnowledge.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import crypto from "crypto";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/gdg-mmmut";
const NOMIC_API_KEY = process.env.NOMIC_API_KEY;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Define Knowledge schema inline (to avoid import issues)
const knowledgeSchema = new mongoose.Schema({
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  source: {
    type: String,
    enum: ["Events", "Core Team", "Manual", "PDF", "FAQ"],
    default: "Manual",
  },
  title: { type: String, default: "Untitled" },
  category: {
    type: String,
    enum: [
      "event",
      "team",
      "leadership",
      "faq",
      "general",
      "contact",
      "technical",
    ],
    default: "general",
  },
  importance: {
    type: String,
    enum: ["high", "normal", "low"],
    default: "normal",
  },
  keywords: [String],
  dateRelevance: {
    type: String,
    enum: ["current", "past", "future", "timeless"],
    default: "timeless",
  },
  academicYear: String,
  hash: { type: String, required: true, unique: true },
});

const Knowledge = mongoose.model("Knowledge", knowledgeSchema);

/**
 * Generate MD5 hash for content deduplication
 */
const generateHash = (text) => {
  return crypto.createHash("md5").update(text).digest("hex");
};

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
        task_type: "search_document",
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
    throw error;
  }
};

/**
 * Remove invalid entries
 */
const removeInvalidEntries = async () => {
  console.log("\n🧹 Removing invalid entries...");

  // Find entries with very short text (likely invalid)
  const invalidEntries = await Knowledge.find({
    $or: [
      { text: { $regex: /^.{1,10}$/ } }, // Text less than 10 chars
      { title: { $regex: /^enevl$/i } }, // Known invalid entry
      { text: { $regex: /^ke$/i } }, // Known invalid entry
    ],
  });

  if (invalidEntries.length > 0) {
    console.log(`   Found ${invalidEntries.length} invalid entries:`);
    invalidEntries.forEach((e) => {
      console.log(`   - "${e.title}" (text: "${e.text.slice(0, 20)}...")`);
    });

    await Knowledge.deleteMany({
      _id: { $in: invalidEntries.map((e) => e._id) },
    });
    console.log(`   ✅ Deleted ${invalidEntries.length} invalid entries`);
  } else {
    console.log("   No invalid entries found");
  }
};

/**
 * Remove duplicate entries (same text)
 */
const removeDuplicates = async () => {
  console.log("\n🔄 Checking for duplicates...");

  const pipeline = [
    {
      $group: {
        _id: "$text",
        count: { $sum: 1 },
        ids: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ];

  const duplicates = await Knowledge.aggregate(pipeline);

  if (duplicates.length > 0) {
    let totalDeleted = 0;
    for (const dup of duplicates) {
      // Keep the first one, delete the rest
      const idsToDelete = dup.ids.slice(1);
      await Knowledge.deleteMany({ _id: { $in: idsToDelete } });
      totalDeleted += idsToDelete.length;
    }
    console.log(`   ✅ Removed ${totalDeleted} duplicate entries`);
  } else {
    console.log("   No duplicates found");
  }
};

/**
 * Update entries with metadata based on content analysis
 */
const updateMetadata = async () => {
  console.log("\n📊 Updating metadata for existing entries...");

  const entries = await Knowledge.find({});
  let updated = 0;

  for (const entry of entries) {
    const text = entry.text.toLowerCase();
    const title = (entry.title || "").toLowerCase();
    let changed = false;

    // Determine category
    if (!entry.category || entry.category === "general") {
      if (/lead|organizer|co-lead|mentor|team member|head of/.test(text)) {
        entry.category = "leadership";
        changed = true;
      } else if (/event|workshop|hackathon|session|meetup/.test(text)) {
        entry.category = "event";
        changed = true;
      } else if (/instagram|email|linkedin|contact|reach out/.test(text)) {
        entry.category = "contact";
        changed = true;
      } else if (/join|apply|registration|member|recruit/.test(text)) {
        entry.category = "faq";
        changed = true;
      }
    }

    // Determine importance
    if (!entry.importance || entry.importance === "normal") {
      if (/organizer|lead|2025|current/.test(text)) {
        entry.importance = "high";
        changed = true;
      }
    }

    // Determine date relevance
    if (!entry.dateRelevance || entry.dateRelevance === "timeless") {
      if (/2025|current|upcoming/.test(text)) {
        entry.dateRelevance = "current";
        changed = true;
      } else if (/2024|2023|past|previous/.test(text)) {
        entry.dateRelevance = "past";
        changed = true;
      }
    }

    // Extract keywords
    if (!entry.keywords || entry.keywords.length === 0) {
      const keywords = [];
      if (/vikhyat/i.test(text)) keywords.push("vikhyat", "organizer", "lead");
      if (/ai\/?ml/i.test(text)) keywords.push("ai", "ml", "machine learning");
      if (/cloud/i.test(text)) keywords.push("cloud", "gcp", "google cloud");
      if (/web/i.test(text)) keywords.push("web", "frontend", "backend");
      if (/android/i.test(text)) keywords.push("android", "mobile", "app");
      if (/hackathon/i.test(text))
        keywords.push("hackathon", "coding", "competition");

      if (keywords.length > 0) {
        entry.keywords = keywords;
        changed = true;
      }
    }

    if (changed) {
      await entry.save();
      updated++;
    }
  }

  console.log(`   ✅ Updated metadata for ${updated} entries`);
};

/**
 * Add FAQ entries for common questions
 */
const addFAQEntries = async () => {
  console.log("\n📝 Adding FAQ entries...");

  const faqs = [
    {
      title: "How to join GDG MMMUT",
      text: "To join GDG MMMUT (Google Developer Group on Campus at MMMUT), follow these steps:\n\n1. **Follow on Social Media**: Follow @gdgmmmut on Instagram for updates about recruitment drives.\n2. **Wait for Recruitment**: GDG MMMUT conducts recruitment drives at the beginning of each academic year (usually August-September).\n3. **Apply When Open**: When recruitment opens, fill out the application form shared on our social media.\n4. **Interview Process**: Shortlisted candidates go through a technical or domain-specific interview.\n5. **Selection**: Selected members are announced and added to the community.\n\nThere are no membership fees. Anyone from MMMUT (undergraduate or postgraduate) can apply.",
      category: "faq",
      importance: "high",
      keywords: [
        "join",
        "membership",
        "apply",
        "registration",
        "become member",
      ],
      dateRelevance: "timeless",
    },
    {
      title: "GDG MMMUT Contact Information",
      text: "You can reach GDG MMMUT through the following channels:\n\n- **Instagram**: @gdgmmmut (primary communication channel)\n- **LinkedIn**: Google Developer Group on Campus MMMUT\n- **GitHub**: github.com/gdg-mmmut\n- **Email**: Contact through Instagram DMs for fastest response\n- **Website**: Visit our official website for event information\n\nFor event inquiries, collaboration requests, or speaker opportunities, DM us on Instagram.",
      category: "contact",
      importance: "high",
      keywords: [
        "contact",
        "email",
        "instagram",
        "linkedin",
        "reach",
        "social media",
      ],
      dateRelevance: "timeless",
    },
    {
      title: "What is GDG MMMUT",
      text: "GDG MMMUT (Google Developer Group on Campus at Madan Mohan Malaviya University of Technology) is an official Google-supported developer community. We are part of the global GDG network.\n\n**Our Mission**:\n- Foster a vibrant tech community at MMMUT\n- Provide learning opportunities through workshops, hackathons, and study jams\n- Connect students with industry professionals and Google technologies\n- Build projects that solve real-world problems\n\n**What We Do**:\n- **Workshops**: Hands-on sessions on web dev, AI/ML, cloud computing\n- **Hackathons**: TechSprint, HackBlitz competitions\n- **Study Jams**: Google Cloud Study Jams with Qwiklabs\n- **Speaker Sessions**: Industry talks and tech discussions\n- **Open Source**: Collaborative projects on GitHub",
      category: "general",
      importance: "high",
      keywords: ["gdg", "about", "what is", "google developer group", "mmmut"],
      dateRelevance: "timeless",
    },
    {
      title: "GDG MMMUT Leadership Hierarchy 2025-26",
      text: "The GDG MMMUT leadership structure for the 2025-26 academic year:\n\n**GDGoC Organizer (Lead)**: Vikhyat Singh\n- Overall head of GDG on Campus MMMUT\n- Represents GDG MMMUT to Google and external partners\n\n**Domain Leads**:\n- Each technical domain (AI/ML, Web Development, Android, Cloud, etc.) has a dedicated Lead\n- Domain Leads organize workshops and manage domain-specific activities\n\n**Core Team**:\n- Selected members who help organize events and manage operations\n- Includes Technical Leads, Event Management, Design, and Content teams\n\nFor the complete list of current leads, check the Core Team page on our website.",
      category: "leadership",
      importance: "high",
      keywords: [
        "organizer",
        "lead",
        "vikhyat",
        "hierarchy",
        "structure",
        "2025",
      ],
      dateRelevance: "current",
      academicYear: "2025-26",
    },
  ];

  let added = 0;

  for (const faq of faqs) {
    // Check if similar FAQ already exists
    const existing = await Knowledge.findOne({
      title: { $regex: new RegExp(faq.title.slice(0, 20), "i") },
      source: "FAQ",
    });

    if (!existing) {
      console.log(`   Adding: "${faq.title}"`);

      // Generate embedding and hash
      const embedding = await getNomicEmbedding(faq.text);
      const hash = generateHash(faq.text);

      // Check if hash already exists (content duplicate)
      const hashExists = await Knowledge.findOne({ hash });
      if (hashExists) {
        console.log(`   Skipping (duplicate content): "${faq.title}"`);
        continue;
      }

      await Knowledge.create({
        ...faq,
        source: "FAQ",
        embedding,
        hash,
      });

      added++;
    } else {
      console.log(`   Skipping (exists): "${faq.title}"`);
    }
  }

  console.log(`   ✅ Added ${added} new FAQ entries`);
};

/**
 * Main cleanup function
 */
const runCleanup = async () => {
  console.log("🚀 Starting Knowledge Base Cleanup...\n");
  console.log("=".repeat(50));

  try {
    await removeInvalidEntries();
    await removeDuplicates();
    await updateMetadata();

    if (NOMIC_API_KEY && !NOMIC_API_KEY.includes("placeholder")) {
      await addFAQEntries();
    } else {
      console.log(
        "\n⚠️  Skipping FAQ additions (NOMIC_API_KEY not configured)",
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Knowledge Base Cleanup Complete!");

    // Print summary
    const stats = await Knowledge.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
    ]);
    console.log("\n📊 Current Knowledge Base Stats:");
    stats.forEach((s) => console.log(`   - ${s._id}: ${s.count} entries`));

    const total = await Knowledge.countDocuments();
    console.log(`   - Total: ${total} entries`);
  } catch (error) {
    console.error("❌ Cleanup error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
};

// Run the cleanup
runCleanup();
