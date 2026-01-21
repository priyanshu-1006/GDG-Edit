import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
// Removed unused pdf-parse require
import axios from "axios";
import crypto from "crypto";
import Knowledge from "../models/Knowledge.js";
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
        });
      });
    }

    console.log(`🚀 Ready to ingest ${knowledgeEntries.length} chunks...`);

    // 3. Embedding and Upserting
    let added = 0;
    let failed = 0;

    for (const [index, entry] of knowledgeEntries.entries()) {
      const hash = generateHash(entry.text);

      try {
        if (!NOMIC_API_KEY || NOMIC_API_KEY.includes("placeholder")) {
          throw new Error(
            "Skipping embedding generation due to missing API Key",
          );
        }

        const embedding = await getNomicEmbedding(entry.text);

        await Knowledge.create({
          title: entry.title,
          text: entry.text,
          source: entry.source,
          embedding,
          hash,
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
