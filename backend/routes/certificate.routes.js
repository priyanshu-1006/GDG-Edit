import express from "express";
import Certificate from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import imageUpload from "../middleware/imageUpload.middleware.js";
import * as XLSX from "xlsx";
import path from "path";
import { promises as fsPromises } from "fs";
import { fileURLToPath } from "url";
import axios from "axios";
import archiver from "archiver";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { v2 as cloudinary } from "cloudinary";
import emailService from "../services/emailService.js";
import { certificateTemplate } from "../utils/emailTemplates.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, "../public");
const CERTIFICATE_EMAIL_BASE_URL = "https://gdg.mmmut.app";

const isCloudinaryConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const uploadTemplateToCloudinary = (buffer, originalname) => {
  const ext = path.extname(originalname || "") || ".png";
  const publicId = `template-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "gdg/certificates/templates",
        resource_type: "image",
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

const sanitizeFileName = (value) => {
  return String(value || "certificate")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
};

const extensionFromUrl = (urlValue) => {
  try {
    const parsed = new URL(urlValue);
    const ext = path.extname(parsed.pathname);
    return ext || ".png";
  } catch {
    const ext = path.extname(urlValue || "");
    return ext || ".png";
  }
};

const getLocalCertificatePath = (certificateUrl) => {
  if (!certificateUrl || typeof certificateUrl !== "string") {
    return null;
  }

  if (!certificateUrl.startsWith("/")) {
    return null;
  }

  const normalizedRelative = path
    .normalize(certificateUrl)
    .replace(/^([/\\])+/, "");
  const absolutePath = path.resolve(publicDir, normalizedRelative);

  // Prevent path traversal by verifying final path is inside public directory.
  if (!absolutePath.startsWith(publicDir)) {
    return null;
  }

  return absolutePath;
};

const parseBoxWidth = (width, imageWidth) => {
  if (typeof width === "number") {
    if (width > 0 && width <= 100) {
      return (width / 100) * imageWidth;
    }
    return width;
  }

  if (typeof width === "string" && width.includes("%")) {
    const widthPercent = Number.parseFloat(width);
    if (!Number.isNaN(widthPercent)) {
      return imageWidth * (widthPercent / 100);
    }
  }

  return imageWidth * 0.4;
};

const isValidEmail = (email) => {
  const normalized = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

const isValidCertificateCode = (code) => {
  const normalized = String(code || "").trim();
  return normalized.length >= 6;
};

const isValidAbsoluteHttpUrl = (urlValue) => {
  try {
    const parsed = new URL(String(urlValue || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const buildCertificateEmailPayload = (certificate) => {
  const recipientEmail = String(
    certificate.recipientEmail || certificate.user?.email || "",
  )
    .trim()
    .toLowerCase();

  if (!isValidEmail(recipientEmail)) {
    return { error: "Invalid recipient email" };
  }

  const certificateCode = String(certificate.certificateCode || "").trim();
  if (!isValidCertificateCode(certificateCode)) {
    return { error: "Invalid certificate ID" };
  }

  const recipientName = certificate.recipientName || certificate.user?.name || "Recipient";
  const eventName = certificate.event?.name || certificate.customEventName || "GDG MMMUT Event";
  const eventId = certificate.event?._id ? String(certificate.event._id) : "";

  const certificateUrl = `${CERTIFICATE_EMAIL_BASE_URL}/verification/${encodeURIComponent(certificateCode)}`;
  const eventUrl = eventId
    ? `${CERTIFICATE_EMAIL_BASE_URL}/events/${eventId}`
    : `${CERTIFICATE_EMAIL_BASE_URL}/events`;

  if (!isValidAbsoluteHttpUrl(certificateUrl) || !isValidAbsoluteHttpUrl(eventUrl)) {
    return { error: "Generated email links are invalid" };
  }

  return {
    recipientEmail,
    recipientName,
    eventName,
    eventId,
    certificateCode,
    certificateUrl,
    eventUrl,
  };
};

const resolveDynamicValue = (rawKey, certificate) => {
  const keyLC = String(rawKey || "").trim().toLowerCase();
  const recipientName =
    certificate.recipientName || certificate.user?.name || "Valued Member";
  const recipientEmail = certificate.recipientEmail || certificate.user?.email || "";

  if (["name", "recipient name", "recipientname"].includes(keyLC)) {
    return recipientName;
  }

  if (["email", "recipient email", "recipientemail"].includes(keyLC)) {
    return recipientEmail;
  }

  if (keyLC === "date") {
    return new Date(certificate.issuedAt || Date.now()).toLocaleDateString();
  }

  if (["certi id", "certi_id", "certificate id", "certificate_id", "certificateid", "certiid", "id"].includes(keyLC)) {
    return certificate.certificateCode || certificate._id || "";
  }

  const extraData = certificate.extraData || {};
  if (extraData[rawKey] !== undefined && extraData[rawKey] !== null) {
    return String(extraData[rawKey]);
  }

  const foundKey = Object.keys(extraData).find(
    (candidateKey) => candidateKey.toLowerCase() === keyLC,
  );

  if (foundKey) {
    return String(extraData[foundKey]);
  }

  return `{${rawKey}}`;
};

const loadTemplateImage = async (certificateUrl) => {
  const localPath = getLocalCertificatePath(certificateUrl);
  if (localPath) {
    const fileBuffer = await fsPromises.readFile(localPath);
    return loadImage(fileBuffer);
  }

  if (/^https?:\/\//i.test(certificateUrl || "")) {
    const response = await axios.get(certificateUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
    });
    return loadImage(Buffer.from(response.data));
  }

  throw new Error("Unsupported certificate URL format for dynamic rendering");
};

const renderDynamicCertificateBuffer = async (certificate) => {
  const templateImage = await loadTemplateImage(certificate.certificateUrl);
  const canvas = createCanvas(templateImage.width, templateImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(templateImage, 0, 0, templateImage.width, templateImage.height);

  const recipientName =
    certificate.recipientName || certificate.user?.name || "Valued Member";

  const drawNameFallback = () => {
    const fallbackFontSize = Math.max(28, templateImage.height * 0.06);
    ctx.font = `700 ${fallbackFontSize}px Arial`;
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(recipientName, templateImage.width / 2, templateImage.height * 0.52);
  };

  if (!Array.isArray(certificate.positioning)) {
    const legacyPos = certificate.positioning || {};
    const x = Number(legacyPos.x || 50);
    const y = Number(legacyPos.y || 50);
    const fontSize = Number(legacyPos.fontSize || 30);
    const color = legacyPos.color || "#000000";

    ctx.font = `700 ${Math.max(16, fontSize)}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const drawX = x <= 100 ? (x / 100) * templateImage.width : x;
    const drawY = y <= 100 ? (y / 100) * templateImage.height : y;

    // Support placeholder substitution in legacy format
    let textContent = legacyPos.text || recipientName;
    if (typeof textContent === "string" && textContent.includes("{")) {
      textContent = textContent.replace(/\{(.+?)\}/g, (_, key) =>
        resolveDynamicValue(key, certificate),
      );
    }

    ctx.fillText(textContent, drawX, drawY);

    return canvas.toBuffer("image/png");
  }

  let hasNameElement = false;

  for (const element of certificate.positioning) {
    const rawText =
      typeof element.text === "string"
        ? element.text
        : typeof element.content === "string"
          ? element.content
          : typeof element.id === "string" && /name/i.test(element.id)
            ? "{Name}"
            : "";

    if (!rawText) {
      continue;
    }

    const finalText = rawText.replace(/\{(.+?)\}/g, (_, key) =>
      resolveDynamicValue(key, certificate),
    );

    const x = Number(element.x || 0);
    const y = Number(element.y || 0);
    const fontSize = Number(element.fontSize || 24);
    const color = element.color || "#000000";
    const fontWeight = element.fontWeight || "normal";
    const textAlign = element.textAlign || "center";
    const boxW = parseBoxWidth(element.width, templateImage.width);

    const xLeft = x <= 100 ? (x / 100) * templateImage.width : x;
    const yTop = y <= 100 ? (y / 100) * templateImage.height : y;

    const fontSizeFromRatio =
      typeof element.fontSizeRatio === "number"
        ? element.fontSizeRatio * templateImage.height
        : (fontSize / 800) * templateImage.height;
    const finalFontSize = Math.max(12, fontSizeFromRatio * 1.33);

    ctx.font = `${fontWeight} ${finalFontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = "middle";

    const words = finalText.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      continue;
    }

    const lines = [];
    let currentLine = words[0];

    for (let index = 1; index < words.length; index++) {
      const candidateLine = `${currentLine} ${words[index]}`;
      if (ctx.measureText(candidateLine).width <= boxW) {
        currentLine = candidateLine;
      } else {
        lines.push(currentLine);
        currentLine = words[index];
      }
    }
    lines.push(currentLine);

    const lineHeight = finalFontSize * 1.2;
    const totalTextHeight = lines.length * lineHeight;

    let xAnchor = xLeft;
    if (textAlign === "center") xAnchor = xLeft + boxW / 2;
    if (textAlign === "right") xAnchor = xLeft + boxW;

    let blockYStart = yTop + finalFontSize / 2;
    if (typeof element.heightRatio === "number" && element.heightRatio > 0) {
      const boxH = element.heightRatio * templateImage.height;
      blockYStart = yTop + (boxH - totalTextHeight) / 2 + lineHeight / 2;
    }

    lines.forEach((line, lineIndex) => {
      const lineY = blockYStart + lineIndex * lineHeight;
      ctx.fillText(line, xAnchor, lineY);
    });

    const lowerRawText = rawText.toLowerCase();
    if (
      lowerRawText.includes("{name}") ||
      lowerRawText.includes("{recipient name}") ||
      lowerRawText.includes("{recipientname}") ||
      (typeof element.id === "string" && /name/i.test(element.id))
    ) {
      hasNameElement = true;
    }
  }

  if (!hasNameElement) {
    drawNameFallback();
  }

  return canvas.toBuffer("image/png");
};

// @route   GET /api/certificates
// @desc    Get all certificates (Admin only)
// @access  Private (Admin)
router.get(
  "/",
  protect,
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const certificates = await Certificate.find()
        .populate("user", "name email")
        .populate("event", "name date")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: certificates.length,
        certificates, // Note: standardizing response to "certificates"
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route   GET /api/certificates/my-certificates
// @desc    Get user's certificates
// @access  Private
router.get("/my-certificates", protect, async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate("event", "name date type")
      .sort({ issuedAt: -1 });

    res.json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/certificates/debug/list-codes
// @desc    List all certificate codes (development only for debugging)
// @access  Private (Protected, Development only)
router.get("/debug/list-codes", protect, async (req, res, next) => {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "This endpoint is only available in development",
    });
  }

  try {
    const certificates = await Certificate.find(
      {},
      { certificateCode: 1, recipientName: 1, recipientEmail: 1, issuedAt: 1 },
    )
      .sort({ issuedAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: certificates.length,
      message: "Recent certificate codes (for debugging)",
      certificates: certificates.map((c) => ({
        code: c.certificateCode,
        recipient: c.recipientName || c.recipientEmail || "Unknown",
        issued: c.issuedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/certificates/verify/:code
// @desc    Verify certificate by code
// @access  Public
router.get("/verify/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const trimmedCode = code.trim();
    console.log(`[Certificate Verify] Looking up certificate code: "${code}"`);

    const certificate = await Certificate.findOne({
      certificateCode: trimmedCode,
    })
      .populate("user", "name email")
      .populate("event", "name date type location");

    if (!certificate) {
      console.warn(
        `[Certificate Verify] Certificate not found for code: "${trimmedCode}"`,
      );
      return res.status(404).json({
        success: false,
        message: `Certificate with code "${trimmedCode}" not found. Please check the code and try again.`,
        code: trimmedCode,
      });
    }

    console.log(
      `[Certificate Verify] Successfully retrieved certificate: ${certificate._id}`,
    );

    res.json({
      success: true,
      certificate,
    });
  } catch (error) {
    console.error(`[Certificate Verify] Error: ${error.message}`, error.stack);
    next(error);
  }
});

// @route   POST /api/certificates
// @desc    Issue certificate
// @access  Private (Admin only)
router.post(
  "/",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  async (req, res, next) => {
    try {
      const {
        userId,
        eventId,
        certificateUrl,
        recipientName,
        recipientEmail,
        certificateCode,
        issuedAt,
      } = req.body;

      // Check if certificate already issued (if userId is provided)
      if (userId) {
        const existing = await Certificate.findOne({
          user: userId,
          event: eventId,
        });

        if (existing) {
          return res.status(400).json({
            success: false,
            message: "Certificate already issued for this user and event",
          });
        }
      }

      // If no userId, ensure recipientName is provided
      if (!userId && !recipientName) {
        return res.status(400).json({
          success: false,
          message: "Recipient Name is required for manual issuance",
        });
      }

      // Generate or use provided certificate code
      const finalCertificateCode =
        certificateCode ||
        `GDG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Check unique code if custom provided
      if (certificateCode) {
        const codeExists = await Certificate.findOne({
          certificateCode: finalCertificateCode,
        });
        if (codeExists) {
          return res.status(400).json({
            success: false,
            message: "Certificate Code already exists",
          });
        }
      }

      const certificate = await Certificate.create({
        user: userId || undefined,
        event: eventId,
        recipientName,
        recipientEmail,
        certificateUrl: certificateUrl.startsWith("/")
          ? certificateUrl
          : `/${certificateUrl}`,
        certificateCode: finalCertificateCode,
        issuedAt: issuedAt ? new Date(issuedAt) : undefined,
        isDynamic: false, // Ensure manual certificates are treated as static
      });

      await certificate.populate("user event");

      res.status(201).json({
        success: true,
        certificate,
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route   POST /api/certificates/upload-template
// @desc    Upload certificate background template
// @access  Private (Admin only)
router.post(
  "/upload-template",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  imageUpload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload an image file" });
      }

      let url = "";
      let filename = req.file.originalname;

      if (isCloudinaryConfigured) {
        const uploaded = await uploadTemplateToCloudinary(
          req.file.buffer,
          req.file.originalname,
        );
        url = uploaded.secure_url;
        filename = uploaded.public_id || filename;
      } else {
        // Local dev fallback when Cloudinary credentials are unavailable.
        const ext = path.extname(req.file.originalname || "") || ".png";
        const localFilename = `template-${Date.now()}-${Math.round(
          Math.random() * 1e9,
        )}${ext}`;
        const uploadDir = path.resolve(publicDir, "uploads/certificates");
        await fsPromises.mkdir(uploadDir, { recursive: true });
        await fsPromises.writeFile(path.resolve(uploadDir, localFilename), req.file.buffer);
        url = `/uploads/certificates/${localFilename}`;
        filename = localFilename;
      }

      res.json({
        success: true,
        url,
        filename,
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route   POST /api/certificates/bulk-issue
// @desc    Bulk issue certificates from Excel/CSV
// @access  Private (Admin only)
router.post(
  "/bulk-issue",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload an Excel file" });
      }

      const {
        eventId,
        customEventName,
        templateUrl,
        textX,
        textY,
        fontSize,
        color,
        layoutConfig,
        issueDate,
      } = req.body;

      if ((!eventId && !customEventName) || !templateUrl) {
        return res.status(400).json({
          success: false,
          message: "Event (ID or Name) and Template URL are required",
        });
      }

      // Parse Excel
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      if (!data || data.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Excel file is empty" });
      }

      const results = { success: 0, failed: 0, errors: [] };

      let positioning;
      try {
        if (layoutConfig) {
          // Support for complex layout from Certificate Designer
          positioning =
            typeof layoutConfig === "string"
              ? JSON.parse(layoutConfig)
              : layoutConfig;
        } else {
          // Fallback to legacy single-text positioning
          positioning = {
            x: parseInt(textX) || 50,
            y: parseInt(textY) || 50,
            fontSize: parseInt(fontSize) || 30,
            color: color || "#000000",
          };
        }
      } catch (e) {
        console.error("Layout parsing error", e);
        positioning = { x: 50, y: 50, fontSize: 30, color: "#000000" };
      }

      // Identify dynamic fields from positioning config
      let dynamicFields = [];
      if (Array.isArray(positioning)) {
        positioning.forEach((el) => {
          const match = el.text && el.text.match(/\{(.+?)\}/);
          if (match && match[1]) {
            const varName = match[1];
            // Exclude standard name/email fields
            if (
              !["recipient name", "name", "recipient email", "email"].includes(
                varName.toLowerCase(),
              )
            ) {
              dynamicFields.push(varName);
            }
          }
        });
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        try {
          const nameKey = Object.keys(row).find(
            (k) =>
              k.toLowerCase().includes("name") &&
              !k.toLowerCase().includes("team") &&
              !k.toLowerCase().includes("event") &&
              !k.toLowerCase().includes("file"),
          );
          const emailKey = Object.keys(row).find(
            (k) =>
              k.toLowerCase().includes("email") &&
              !k.toLowerCase().includes("team") &&
              !k.toLowerCase().includes("event"),
          );

          // Fallback: If no generic 'name' found, look literally for 'Recipient Name'
          const finalNameKey =
            nameKey ||
            Object.keys(row).find((k) => k.toLowerCase() === "recipient name");

          const recipientName = finalNameKey ? row[finalNameKey] : null;
          const recipientEmail = emailKey ? row[emailKey] : null;

          if (!recipientName) {
            results.failed++;
            results.errors.push(`Row ${i + 1}: Name not found`);
            continue;
          }

          // Check duplicates
          if (recipientEmail) {
            const query = {
              recipientEmail,
              ...(eventId ? { event: eventId } : { customEventName }),
            };
            const existing = await Certificate.findOne(query);
            if (existing) {
              results.failed++;
              results.errors.push(
                `Row ${i + 1}: Certificate already exists for ${recipientEmail}`,
              );
              continue;
            }
          }

          // Extract extra data
          const extraData = {};
          dynamicFields.forEach((field) => {
            const key = Object.keys(row).find(
              (k) => k.toLowerCase() === field.toLowerCase(),
            );
            if (key) extraData[field] = row[key];
          });

          // Check for custom Certificate ID in the Excel row
          const idKey = Object.keys(row).find((k) =>
            [
              "certificate id",
              "certificateid",
              "cert id",
              "certid",
              "serial no",
              "serialno",
              "code",
            ].includes(k.toLowerCase().trim()),
          );

          const customId = idKey ? row[idKey] : null;

          const certificateCode = customId
            ? String(customId).trim()
            : `GDG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

          await Certificate.create({
            event: eventId || undefined,
            customEventName: customEventName || undefined,
            recipientName,
            recipientEmail,
            certificateUrl: templateUrl,
            certificateCode,
            isDynamic: true,
            positioning,
            extraData,
            issuedAt: issueDate ? new Date(issueDate) : Date.now(),
          });
          results.success++;
        } catch (rowError) {
          console.error(`Row ${i + 1} Error:`, rowError);
          results.failed++;
          results.errors.push(
            `Row ${i + 1}: ${rowError.message || "Failed to issue"}`,
          );
        }
      }

      res.json({ success: true, summary: results });
    } catch (error) {
      next(error);
    }
  },
);

// @route   GET /api/certificates/download/event/:eventId/zip
// @desc    Download all certificates of an event in ZIP format
// @access  Private (Admin only)
router.get(
  "/download/event/:eventId/zip",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  async (req, res, next) => {
    try {
      const { eventId } = req.params;

      const certificates = await Certificate.find({ event: eventId })
        .populate("user", "name email")
        .populate("event", "name")
        .sort({ issuedAt: -1 });

      if (certificates.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No certificates found for this event",
        });
      }

      const eventName = sanitizeFileName(
        certificates[0]?.event?.name || "event-certificates",
      );
      const zipName = `${eventName}-certificates.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=\"${zipName}\"`);

      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.on("error", (error) => next(error));
      archive.pipe(res);

      const skipped = [];
      let addedFiles = 0;

      for (let i = 0; i < certificates.length; i++) {
        const certificate = certificates[i];
        const recipient =
          certificate.recipientName ||
          certificate.user?.name ||
          certificate.recipientEmail ||
          `recipient_${i + 1}`;
        const certificateCode = certificate.certificateCode || `code_${i + 1}`;
        const fileExt = certificate.isDynamic
          ? ".png"
          : extensionFromUrl(certificate.certificateUrl);
        const zipFileName = `${String(i + 1).padStart(3, "0")}_${sanitizeFileName(recipient)}_${sanitizeFileName(certificateCode)}${fileExt}`;

        try {
          if (certificate.isDynamic) {
            const renderedBuffer = await renderDynamicCertificateBuffer(certificate);
            archive.append(renderedBuffer, { name: zipFileName });
            addedFiles++;
            continue;
          }

          const localPath = getLocalCertificatePath(certificate.certificateUrl);

          if (localPath) {
            await fsPromises.access(localPath);
            archive.file(localPath, { name: zipFileName });
            addedFiles++;
            continue;
          }

          if (/^https?:\/\//i.test(certificate.certificateUrl || "")) {
            const response = await axios.get(certificate.certificateUrl, {
              responseType: "arraybuffer",
              timeout: 15000,
            });
            archive.append(Buffer.from(response.data), { name: zipFileName });
            addedFiles++;
            continue;
          }

          skipped.push({
            certificateId: certificate._id,
            certificateCode,
            reason: "Unsupported certificate URL format",
            certificateUrl: certificate.certificateUrl,
          });
        } catch (error) {
          skipped.push({
            certificateId: certificate._id,
            certificateCode,
            reason: error.message || "Failed to include certificate file",
            certificateUrl: certificate.certificateUrl,
          });
        }
      }

      archive.append(
        JSON.stringify(
          {
            eventId,
            eventName: certificates[0]?.event?.name || "Unknown Event",
            totalCertificates: certificates.length,
            filesAdded: addedFiles,
            filesSkipped: skipped.length,
            skipped,
            generatedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
        { name: "export-summary.json" },
      );

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  },
);

// @route   DELETE /api/certificates/:id
// @desc    Delete/Revoke certificate
// @access  Private (Admin only)
router.delete(
  "/:id",
  protect,
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const certificate = await Certificate.findById(req.params.id);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found",
        });
      }

      await certificate.deleteOne();

      res.json({
        success: true,
        message: "Certificate revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route   POST /api/certificates/:id/send-email
// @desc    Send certificate to recipient email
// @access  Private (Admin only)
router.post(
  "/:id/send-email",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const certificate = await Certificate.findById(id)
        .populate("user", "name email")
        .populate("event", "name");

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found",
        });
      }

      const emailPayload = buildCertificateEmailPayload(certificate);
      if (emailPayload.error) {
        return res.status(400).json({
          success: false,
          message: emailPayload.error,
        });
      }

      // Send email
      try {
        const html = certificateTemplate(
          emailPayload.recipientName,
          emailPayload.certificateCode,
          emailPayload.eventName,
          emailPayload.certificateUrl,
          emailPayload.eventUrl,
        );
        await emailService._send({
          to: emailPayload.recipientEmail,
          subject: `🏆 Certificate Awarded: ${emailPayload.eventName}`,
          html,
          type: 'certificate',
          metadata: {
            certificateId: certificate._id?.toString(),
            eventId: emailPayload.eventId,
            certificateUrl: emailPayload.certificateUrl,
            eventUrl: emailPayload.eventUrl,
          }
        });

        res.json({
          success: true,
          message: `Certificate email sent successfully to ${emailPayload.recipientEmail}`,
        });
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        res.status(500).json({
          success: false,
          message: "Failed to send certificate email: " + emailError.message,
        });
      }
    } catch (error) {
      next(error);
    }
  },
);

// @route   POST /api/certificates/send-emails/bulk
// @desc    Send certificates to multiple recipients
// @access  Private (Admin only)
router.post(
  "/send-emails/bulk",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  async (req, res, next) => {
    try {
      const { certificateIds } = req.body;

      if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide an array of certificate IDs",
        });
      }

      const certificates = await Certificate.find({ _id: { $in: certificateIds } })
        .populate("user", "name email")
        .populate("event", "name");

      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const certificate of certificates) {
        try {
          const emailPayload = buildCertificateEmailPayload(certificate);
          if (emailPayload.error) {
            results.failed++;
            results.errors.push({
              certificateId: certificate._id,
              code: certificate.certificateCode,
              error: emailPayload.error,
            });
            continue;
          }

          // Send email
          const html = certificateTemplate(
            emailPayload.recipientName,
            emailPayload.certificateCode,
            emailPayload.eventName,
            emailPayload.certificateUrl,
            emailPayload.eventUrl,
          );
          await emailService._send({
            to: emailPayload.recipientEmail,
            subject: `🏆 Certificate Awarded: ${emailPayload.eventName}`,
            html,
            type: 'certificate',
            metadata: {
              certificateId: certificate._id?.toString(),
              eventId: emailPayload.eventId,
              certificateUrl: emailPayload.certificateUrl,
              eventUrl: emailPayload.eventUrl,
            }
          });

          results.success++;
          console.log(`✅ Certificate email sent to ${emailPayload.recipientEmail}`);
        } catch (emailError) {
          results.failed++;
          results.errors.push({
            certificateId: certificate._id,
            code: certificate.certificateCode,
            error: emailError.message,
          });
          console.error(`❌ Failed to send email to certificate ${certificate._id}:`, emailError);
        }
      }

      res.json({
        success: true,
        summary: results,
        message: `Sent ${results.success} certificate(s), ${results.failed} failed`,
      });
    } catch (error) {
      next(error);
    }
  },
);

// @route   POST /api/certificates/send-emails/event/:eventId
// @desc    Send certificates to all recipients of a specific event
// @access  Private (Admin only)
router.post(
  "/send-emails/event/:eventId",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  async (req, res, next) => {
    try {
      const { eventId } = req.params;

      const certificates = await Certificate.find({ event: eventId })
        .populate("user", "name email")
        .populate("event", "name");

      if (!certificates.length) {
        return res.status(404).json({
          success: false,
          message: "No certificates found for this event",
        });
      }

      const results = {
        total: certificates.length,
        success: 0,
        failed: 0,
        errors: [],
      };

      for (const certificate of certificates) {
        try {
          const emailPayload = buildCertificateEmailPayload(certificate);
          if (emailPayload.error) {
            results.failed++;
            results.errors.push({
              certificateId: certificate._id,
              code: certificate.certificateCode,
              error: emailPayload.error,
            });
            continue;
          }
          const html = certificateTemplate(
            emailPayload.recipientName,
            emailPayload.certificateCode,
            emailPayload.eventName,
            emailPayload.certificateUrl,
            emailPayload.eventUrl,
          );

          await emailService._send({
            to: emailPayload.recipientEmail,
            subject: `🏆 Certificate Awarded: ${emailPayload.eventName}`,
            html,
            type: "certificate",
            metadata: {
              certificateId: certificate._id?.toString(),
              eventId: emailPayload.eventId,
              certificateUrl: emailPayload.certificateUrl,
              eventUrl: emailPayload.eventUrl,
            },
          });

          results.success++;
        } catch (emailError) {
          results.failed++;
          results.errors.push({
            certificateId: certificate._id,
            code: certificate.certificateCode,
            error: emailError.message,
          });
        }
      }

      return res.json({
        success: true,
        summary: results,
        message: `Event email send complete: ${results.success} sent, ${results.failed} failed`,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
