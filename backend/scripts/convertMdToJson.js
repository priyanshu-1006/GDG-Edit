import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Semantic Markdown Chunking ---
const semanticMarkdownChunking = (text) => {
  const chunks = [];
  const lines = text.split("\n");
  let currentChunk = {
    title: "Introduction",
    content: "",
  };

  // Helper to push current chunk
  const pushChunk = () => {
    if (currentChunk.content.trim().length > 0) {
      chunks.push({
        title: currentChunk.title,
        text: currentChunk.content.trim(),
      });
    }
  };

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,3})\s+(.*)/); // Match H1, H2, H3

    if (headerMatch) {
      // If we hit a new header, save the previous chunk
      pushChunk();

      // Start a new chunk using the header as the title
      currentChunk = {
        title: headerMatch[2].trim(), // Capture the header text
        content: line + "\n", // Include the header in the content too for context
      };
    } else {
      currentChunk.content += line + "\n";
    }
  }

  // Push the final chunk
  pushChunk();

  // Post-process: Split very large chunks if needed (fallback to recursive)
  // For now, we assume headers break things down reasonably well.

  return chunks;
};

const convert = async () => {
  const mdPath = path.resolve(
    __dirname,
    "../../RAG_System/GDG MMMUT Knowledge Base Construction.md",
  );
  const outputPath = path.resolve(
    __dirname,
    "../../RAG_System/rag_manual_data.json",
  );

  if (!fs.existsSync(mdPath)) {
    console.error("❌ Markdown file not found:", mdPath);
    return;
  }

  console.log("📖 Reading Markdown File...");
  const textC = fs.readFileSync(mdPath, "utf8");
  console.log(`   Read ${textC.length} characters.`);

  console.log("🧩 Semantic Chunking...");
  const chunks = semanticMarkdownChunking(textC);

  const outputData = chunks.map((chunk, i) => ({
    title: chunk.title, // Use the extracted header as the title!
    text: chunk.text,
    source: "Manual", // Keep "Manual" so ingestRag.js picks it up
    page: 1,
  }));

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`✅ Saved ${outputData.length} semantic chunks to ${outputPath}`);
};

convert();
