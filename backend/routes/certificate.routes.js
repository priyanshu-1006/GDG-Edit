import express from "express";
import Certificate from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import multer from "multer";
import * as XLSX from "xlsx";
import cloudinary from "../config/cloudinary.js";

// Memory storage for certificate images (uploaded to Cloudinary, not disk)
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only images and PDFs are allowed!"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "gdg-certificates", resource_type: "auto", ...options },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const router = express.Router();

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

// @route   GET /api/certificates/verify/:code
// @desc    Verify certificate by code
// @access  Public
router.get("/verify/:code", async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateCode: req.params.code,
    })
      .populate("user", "name email")
      .populate("event", "name date type location");

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
      });
    }

    res.json({
      success: true,
      certificate,
    });
  } catch (error) {
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
        customEventName,
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
        event: eventId || undefined,
        customEventName: customEventName || undefined,
        recipientName,
        recipientEmail,
        certificateUrl: certificateUrl,
        certificateCode: finalCertificateCode,
        issuedAt: issuedAt ? new Date(issuedAt) : undefined,
        isDynamic: false,
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
// @desc    Upload certificate background template to Cloudinary
// @access  Private (Admin only)
router.post(
  "/upload-template",
  protect,
  authorize("admin", "event_manager", "super_admin"),
  memoryUpload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Please upload an image file" });
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        public_id: `template-${Date.now()}`,
      });

      res.json({
        success: true,
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        filename: req.file.originalname,
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
// @route   PATCH /api/certificates/update-url
// @desc    Update certificate URL by certificate code
// @access  Private (Admin only)
router.patch(
  "/update-url",
  protect,
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const { certificateCode, certificateUrl } = req.body;
      if (!certificateCode || !certificateUrl) {
        return res.status(400).json({
          success: false,
          message: "certificateCode and certificateUrl are required",
        });
      }

      const cert = await Certificate.findOneAndUpdate(
        { certificateCode },
        { certificateUrl },
        { new: true }
      );

      if (!cert) {
        return res.status(404).json({
          success: false,
          message: `Certificate with code "${certificateCode}" not found`,
        });
      }

      res.json({ success: true, certificate: cert });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/certificates/:id
// @desc    Update certificate details
// @access  Private (Admin only)
router.put(
  "/:id",
  protect,
  authorize("admin", "super_admin"),
  async (req, res, next) => {
    try {
      const { recipientName, recipientEmail, customEventName, certificateCode, certificateUrl, issuedAt } = req.body;

      const update = {};
      if (recipientName !== undefined) update.recipientName = recipientName;
      if (recipientEmail !== undefined) update.recipientEmail = recipientEmail;
      if (customEventName !== undefined) update.customEventName = customEventName;
      if (certificateCode !== undefined) update.certificateCode = certificateCode;
      if (certificateUrl !== undefined) update.certificateUrl = certificateUrl;
      if (issuedAt !== undefined) update.issuedAt = new Date(issuedAt);

      const cert = await Certificate.findByIdAndUpdate(req.params.id, update, { new: true });

      if (!cert) {
        return res.status(404).json({ success: false, message: "Certificate not found" });
      }

      res.json({ success: true, certificate: cert });
    } catch (error) {
      next(error);
    }
  }
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

      // Delete from Cloudinary if it's a Cloudinary URL
      if (certificate.certificateUrl && certificate.certificateUrl.includes("cloudinary.com")) {
        try {
          // Extract public_id from URL: .../gdg-certificates/cert-XXXX.jpg
          const urlParts = certificate.certificateUrl.split("/");
          const folder = urlParts[urlParts.length - 2];
          const fileWithExt = urlParts[urlParts.length - 1];
          const publicId = `${folder}/${fileWithExt.split(".")[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudErr) {
          console.error("Cloudinary delete error (non-blocking):", cloudErr.message);
        }
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

export default router;
