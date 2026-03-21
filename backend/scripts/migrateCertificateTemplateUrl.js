import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Certificate from "../models/Certificate.js";

const oldUrl = process.argv[2];
const localFilePathArg = process.argv[3];

if (!oldUrl || !localFilePathArg) {
  console.error(
    "Usage: node scripts/migrateCertificateTemplateUrl.js <oldRelativeUrl> <localFilePath>",
  );
  process.exit(1);
}

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error("Cloudinary environment variables are missing.");
  process.exit(1);
}

const localFilePath = path.resolve(localFilePathArg);
if (!fs.existsSync(localFilePath)) {
  console.error(`Local template file not found: ${localFilePath}`);
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

try {
  await mongoose.connect(process.env.MONGODB_URI);

  const affectedCount = await Certificate.countDocuments({ certificateUrl: oldUrl });
  console.log(`Found ${affectedCount} certificate(s) with URL: ${oldUrl}`);

  if (affectedCount === 0) {
    console.log("No records to migrate. Exiting.");
    await mongoose.disconnect();
    process.exit(0);
  }

  const uploadResult = await cloudinary.uploader.upload(localFilePath, {
    folder: "gdg/certificates/templates",
    resource_type: "image",
    use_filename: true,
    unique_filename: true,
  });

  const newUrl = uploadResult.secure_url;
  console.log(`Uploaded to Cloudinary: ${newUrl}`);

  const updateResult = await Certificate.updateMany(
    { certificateUrl: oldUrl },
    { $set: { certificateUrl: newUrl } },
  );

  console.log(
    `Updated ${updateResult.modifiedCount} certificate(s) to new template URL.`,
  );

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error.message);
  await mongoose.disconnect();
  process.exit(1);
}
