import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import Knowledge from "../models/Knowledge.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Knowledge.countDocuments();
    console.log(`Knowledge Count: ${count}`);

    // List a title to verify
    const one = await Knowledge.findOne();
    if (one) console.log("Sample:", one.title);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

check();
