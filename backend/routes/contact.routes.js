import express from "express";
import { sendGlobalEmail } from "../utils/unifiedEmail.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
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
