import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
// Removed unused pdf-parse require
import axios from "axios";
import crypto from "crypto";
import Knowledge from "../models/Knowledge.js";
import Event from "../models/Event.js";
import CoreTeamMember from "../models/CoreTeamMember.js";
import Induction from "../models/Induction.js";
import Settings from "../models/Settings.js";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
const NOMIC_API_KEY = process.env.NOMIC_API_KEY;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

if (!NOMIC_API_KEY || NOMIC_API_KEY.includes("placeholder")) {
  console.warn(
    "⚠️  NOMIC_API_KEY is missing or is a placeholder. Embeddings will fail.",
  );
}

// Nomic Embed API Endpoint (v1.5)
const NOMIC_URL =
  "https://api-inference.huggingface.co/models/nomic-ai/nomic-embed-text-v1.5";
// Wait, Nomic has their own API too. Let's use the official Nomic Atlas API or the inference API.
// User said "nomic models for embedding generations".
// Common usage: https://api.nomic.ai/v1/embedding/text
// Let's use the standard Nomic API endpoint.

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
    console.error(
      "Error fetching embedding:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

const generateHash = (text) => {
  return crypto.createHash("md5").update(text).digest("hex");
};

const FRONTEND_TEXT_FILES = [
  "../../frontend/src/sections/AboutSection.jsx",
  "../../frontend/src/pages/About.jsx",
  "../../frontend/src/sections/ContactSection.jsx",
  "../../frontend/src/pages/Team.jsx",
  "../../frontend/src/pages/InductionForm.jsx",
  "../../frontend/src/sections/EventsSection.jsx",
];

const normalizeWhitespace = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

const isUsefulSentence = (line) => {
  const clean = normalizeWhitespace(line);
  if (clean.length < 30 || clean.length > 400) return false;
  if (/[{};]/.test(clean)) return false;
  if (/^(const|import|export|return|if|for|while|onClick|className|styled\.)/.test(clean)) return false;
  return /[A-Za-z]/.test(clean);
};

const extractWebsiteCopy = (fileContent) => {
  const extracted = [];

  // JSX inner text segments
  const jsxTextRegex = />\s*([^<>{}\n][^<>{}]*)\s*</g;
  let jsxMatch;
  while ((jsxMatch = jsxTextRegex.exec(fileContent)) !== null) {
    const text = normalizeWhitespace(jsxMatch[1]);
    if (isUsefulSentence(text)) extracted.push(text);
  }

  // Long quoted strings
  const quotedRegex = /["'`]([^"'`\n]{30,400})["'`]/g;
  let quotedMatch;
  while ((quotedMatch = quotedRegex.exec(fileContent)) !== null) {
    const text = normalizeWhitespace(quotedMatch[1]);
    if (isUsefulSentence(text)) extracted.push(text);
  }

  return Array.from(new Set(extracted));
};

const collectFrontendWebsiteEntries = () => {
  const entries = [];

  for (const relFile of FRONTEND_TEXT_FILES) {
    const fullPath = path.resolve(__dirname, relFile);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = extractWebsiteCopy(content);
    if (!lines.length) continue;

    const merged = lines.join("\n");
    const chunks = recursiveChunking(merged, 1200, 150);
    const fileName = path.basename(relFile);

    chunks.forEach((chunk) => {
      entries.push({
        title: `Website Content: ${fileName}`,
        text: chunk,
        source: "Website Data",
        category: "general",
        importance: "normal",
      });
    });
  }

  return entries;
};

const collectLiveWebsiteEntries = async () => {
  const entries = [];

  // Public induction form details (no applicant PII)
  const settings = await Settings.findOne().lean();
  const inductionOpen = settings?.isInductionOpen !== false;
  const branchOptions = Induction.schema.path("branch")?.enumValues || [];
  const domainOptions = Induction.schema.path("domains")?.caster?.enumValues || [];
  const statusOptions = Induction.schema.path("status")?.enumValues || [];

  entries.push({
    title: "Induction Form Details",
    text: normalizeWhitespace(`
      GDG MMMUT induction form status: ${inductionOpen ? "OPEN" : "CLOSED"}.
      The form collects: first name, last name, email, phone, branch, section, roll number,
      residence type, tech stack, domains of interest, projects, GitHub ID, LinkedIn URL,
      why join answer, interesting fact, other clubs, coding profile IDs, and resume URL.
      Allowed domains: ${domainOptions.join(", ")}.
      Allowed branch values include: ${branchOptions.slice(0, 20).join(", ")}.
      Application statuses used by the system: ${statusOptions.join(", ")}.
      Public induction endpoints include /api/induction/status and /api/induction/results.
    `),
    source: "Website Data",
    category: "general",
    importance: "high",
    keywords: ["induction", "form", "application", "status"],
  });

  // Public events (prefer published, fallback to latest)
  let events = await Event.find({ published: true }).sort({ date: -1 }).lean();
  if (!events.length) {
    events = await Event.find({}).sort({ date: -1 }).limit(30).lean();
  }

  if (events.length) {
    entries.push({
      title: "Events Overview",
      text: normalizeWhitespace(
        `GDG MMMUT currently has ${events.length} events available in the system. ` +
          "Users can ask about event names, types, schedules, locations, registration status, tags, and deadlines.",
      ),
      source: "Events",
      category: "event",
      importance: "high",
    });

    events.forEach((event) => {
      entries.push({
        title: `Event: ${event.name}`,
        text: normalizeWhitespace(`
          Name: ${event.name}
          Type: ${event.type}
          Category: ${event.eventCategory || "general"}
          Description: ${event.description || "N/A"}
          Location: ${event.location || "N/A"}
          Date: ${event.date ? new Date(event.date).toDateString() : "N/A"}
          Time: ${event.time || "N/A"}
          Capacity: ${event.capacity ?? "N/A"}
          Registered Count: ${event.registeredCount ?? 0}
          Published: ${event.published ? "Yes" : "No"}
          Registration Open: ${event.registrationOpen ? "Yes" : "No"}
          Registration Deadline: ${event.registrationDeadline ? new Date(event.registrationDeadline).toDateString() : "N/A"}
          Tags: ${(event.tags || []).join(", ") || "N/A"}
        `),
        source: "Events",
        category: "event",
        importance: "high",
      });
    });
  }

  // Core team details
  const members = await CoreTeamMember.find({ visible: true })
    .sort({ year: -1, order: 1, name: 1 })
    .lean();

  if (members.length) {
    entries.push({
      title: "Core Team Overview",
      text: normalizeWhitespace(
        `GDG MMMUT has ${members.length} visible core team members listed on the website. ` +
          "Team records include name, role, position, badge, year, category, and social profile links.",
      ),
      source: "Core Team",
      category: "team",
      importance: "high",
    });

    members.forEach((member) => {
      entries.push({
        title: `Team Member: ${member.name}`,
        text: normalizeWhitespace(`
          Name: ${member.name}
          Role: ${member.role || "N/A"}
          Position: ${member.position || "N/A"}
          Badge: ${member.badge || "N/A"}
          Year: ${member.year || "N/A"}
          Category: ${member.category || "core"}
          LinkedIn: ${member.social?.linkedin || "N/A"}
          GitHub: ${member.social?.github || "N/A"}
          Twitter: ${member.social?.twitter || "N/A"}
          Instagram: ${member.social?.instagram || "N/A"}
        `),
        source: "Core Team",
        category: member.position?.includes("Lead") ? "leadership" : "team",
        importance: member.position?.includes("Lead") ? "high" : "normal",
      });
    });
  }

  return entries;
};

// --- Advanced Recursive Chunking ---
const recursiveChunking = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // If not at the end, try to break at a clean punctuation
    if (endIndex < text.length) {
      // Look for last period, newline, or space within the chunk
      const lookback = text.substring(startIndex, endIndex);
      const lastPeriod = lookback.lastIndexOf(". ");
      const lastNewline = lookback.lastIndexOf("\n");

      let breakPoint = -1;
      if (lastNewline > chunkSize * 0.5) breakPoint = lastNewline;
      else if (lastPeriod > chunkSize * 0.5) breakPoint = lastPeriod + 1;

      if (breakPoint !== -1) {
        endIndex = startIndex + breakPoint;
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk.length > 50) {
      // Filter tiny chunks
      chunks.push(chunk);
    }

    // Move forward, keeping overlap
    startIndex = endIndex - overlap;
    if (startIndex >= text.length - overlap) break; // Avoid infinite loops at end
  }
  return chunks;
};

const ingest = async () => {
  try {
    const hasValidApiKey =
      Boolean(NOMIC_API_KEY) && !NOMIC_API_KEY.includes("placeholder");

    if (!hasValidApiKey) {
      console.error(
        "❌ Ingestion aborted: NOMIC_API_KEY is missing/invalid. Existing knowledge was not modified.",
      );
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected.");

    // 0. CLEAR EXISTING DATA
    console.log("🧹 Clearing old Knowledge collection...");
    await Knowledge.deleteMany({});
    console.log("✨ Collection cleared.");

    const knowledgeEntries = [];
    console.log("🔍 Resolving paths...");

    // 1. Process JSON
    const jsonPath = path.resolve(
      __dirname,
      "../../RAG_System/rag_knowledge_data.json",
    );

    let rawItems = [];

    if (fs.existsSync(jsonPath)) {
      console.log("📂 Reading JSON Data...");
      const rawData = fs.readFileSync(jsonPath, "utf-8");
      rawItems = JSON.parse(rawData);
      console.log(`   Found ${rawItems.length} raw items.`);
    } else {
      console.error("❌ JSON file not found:", jsonPath);
    }
    // 2. Process PDF
    // 2. Legacy PDF processing removed (converted to JSON externally)
    // 1b. Process Manual Text JSON
    const manualJsonPath = path.resolve(
      __dirname,
      "../../RAG_System/rag_manual_data.json",
    );
    if (fs.existsSync(manualJsonPath)) {
      console.log("📂 Reading Manual Text JSON Data...");
      const manualData = JSON.parse(fs.readFileSync(manualJsonPath, "utf-8"));
      rawItems.push(...manualData); // Merge arrays
      console.log(`   Found ${manualData.length} Manual items.`);
    } else {
      console.warn(
        "⚠️  Manual JSON file not found (Run convertTxtToJson.js first).",
      );
    }

    // 2. Chunking & Preparing
    console.log("🧩 Chunking data...");
    for (const item of rawItems) {
      // If source is PDF, it's already chunked by the converter, but let's re-ensure or just pass through.
      // Actually, our converter does chunking.
      // Let's check if it's already chunked small enough.

      let chunks = [item.text];
      if (item.source !== "PDF") {
        const fullText = `${item.title || ""}\n\n${item.text || ""}`;
        chunks = recursiveChunking(fullText);
      } else {
        // It's already chunked, but let's make sure it fits our new model if needed.
        // For now, accept it as is since convertPdfToJson uses the same logic.
        chunks = [item.text];
      }

      chunks.forEach((chunk) => {
        knowledgeEntries.push({
          title: item.title || "General Knowledge",
          text: chunk,
          source: item.source || "Website Data",
          category: item.category || "general",
          importance: item.importance || "normal",
          keywords: item.keywords || [],
        });
      });
    }

    // 3. Collect live, website-backed content from MongoDB
    console.log("🌐 Collecting live website data from database...");
    const liveWebsiteEntries = await collectLiveWebsiteEntries();
    knowledgeEntries.push(...liveWebsiteEntries);
    console.log(`   Added ${liveWebsiteEntries.length} live website entries.`);

    // 4. Collect static text content from key frontend pages
    console.log("🗂️  Collecting text snapshots from frontend pages...");
    const frontendEntries = collectFrontendWebsiteEntries();
    knowledgeEntries.push(...frontendEntries);
    console.log(`   Added ${frontendEntries.length} frontend text entries.`);

    console.log(`🚀 Ready to ingest ${knowledgeEntries.length} chunks...`);

    // 5. Embedding and Upserting
    let added = 0;
    let failed = 0;

    for (const [index, entry] of knowledgeEntries.entries()) {
      const hash = generateHash(entry.text);

      try {
        const embedding = await getNomicEmbedding(entry.text);

        await Knowledge.create({
          title: entry.title,
          text: entry.text,
          source: entry.source,
          embedding,
          hash,
          category: entry.category || "general",
          importance: entry.importance || "normal",
          keywords: entry.keywords || [],
        });

        added++;
        if (added % 10 === 0) process.stdout.write(".");
      } catch (err) {
        failed++;
        console.error(`\n❌ Error at item ${index}: ${err.message}`);
        // Continue processing others
      }
    }

    console.log(`\n\n✅ Ingestion Complete!`);
    console.log(`   Added: ${added}`);
    console.log(`   Failed: ${failed}`);
  } catch (error) {
    console.error("❌ Script Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

ingest();
