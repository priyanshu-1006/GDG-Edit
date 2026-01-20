import express from "express";
import Certificate from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";
import imageUpload from "../middleware/imageUpload.middleware.js";
import * as XLSX from "xlsx";

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
      const { userId, eventId, certificateUrl } = req.body;

      // Check if certificate already issued
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

      // Generate unique certificate code
      const certificateCode = `GDG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const certificate = await Certificate.create({
        user: userId,
        event: eventId,
        certificateUrl,
        certificateCode,
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

      // Construct URL
      const protocol = req.protocol;
      const host = req.get("host"); // e.g. localhost:5000
      const url = `${protocol}://${host}/uploads/certificates/${req.file.filename}`;

      res.json({
        success: true,
        url,
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

        const certificateCode = `GDG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

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
        });
        results.success++;
      }

      res.json({ success: true, summary: results });
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

export default router;
