import express from "express";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { sendGlobalEmail } from "../utils/unifiedEmail.js";

const router = express.Router();

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many contact requests. Please try again in a few minutes.",
  },
});

const contactValidationRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("subject")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("Subject must be between 3 and 150 characters"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 3000 })
    .withMessage("Message must be between 10 and 3000 characters"),
  body("website")
    .optional({ checkFalsy: true })
    .isEmpty()
    .withMessage("Invalid submission"),
  body("submittedAt")
    .exists()
    .withMessage("Invalid submission")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Invalid submission")
    .toInt(),
];

router.post("/", contactRateLimiter, contactValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0]?.msg || "Invalid input",
    });
  }

  const { name, email, subject, message, website, submittedAt } = req.body;

  // Lightweight bot challenge: honeypot must stay empty and submission should not be instant.
  const now = Date.now();
  const elapsedMs = now - Number(submittedAt);
  if (website || Number.isNaN(elapsedMs) || elapsedMs < 3000 || elapsedMs > 60 * 60 * 1000) {
    return res.status(400).json({ error: "Invalid submission. Please retry." });
  }

  try {

    // 1️⃣ Email to GDG Admin (you)
    const adminMailOptions = {
      to: process.env.MAIL_TO || "gdgtechmmmut@gmail.com",
      subject: `[GDG Contact] ${subject}`,
      text: `
📩 New message from GDG MMMUT Contact Form

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
    };

    // 2️⃣ Auto-reply to the user
    const userMailOptions = {
      to: email,
      subject: "We received your message – GDG MMMUT",
      text: `
Hi ${name},

Thank you for reaching out to GDG On Campus MMMUT! 🙌
We’ve received your message:

"${message}"

Our team will get back to you shortly.
Best regards,  
GDG On Campus MMMUT Team  
📍 Madan Mohan Malaviya University of Technology, Gorakhpur  
🌐 https://gdg.community.dev/
      `,
    };

    // Send both emails
    await sendGlobalEmail(adminMailOptions);
    await sendGlobalEmail(userMailOptions);

    console.log(`✅ Contact email sent by ${name} (${email})`);
    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

export default router;
