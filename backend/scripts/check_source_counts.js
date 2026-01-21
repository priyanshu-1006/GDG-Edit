import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Knowledge from "../models/Knowledge.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const checkCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔌 Connected to MongoDB");

    const counts = await Knowledge.aggregate([
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("📊 Knowledge Counts by Source:");
    counts.forEach((c) => {
      console.log(`   ${c._id}: ${c.count}`);
    });

    const total = counts.reduce((acc, c) => acc + c.count, 0);
    console.log(`   TOTAL: ${total}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
};

checkCounts();
