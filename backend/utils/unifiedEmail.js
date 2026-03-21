import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend conditionally to prevent crash if API key is missing
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Fallback SMTP Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.NODEMAILER_EMAIL || process.env.SMTP_USERNAME || process.env.SMTP_USER,
    pass: process.env.NODEMAILER_PASSWORD || process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
  },
});

export { transporter };

export const sendGlobalEmail = async ({ 
  to, 
  subject, 
  html, 
  text, 
  from = '"IMMERSE 2026 - MMMUT" <team@immerse.mmmut.app>' 
}) => {
  try {
    // Attempt 1: Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || "",
        });

        if (error) {
          console.warn('⚠️ Resend failed, falling back to Nodemailer:', error.message);
        } else {
          console.log(`✅ Email sent via Resend to ${to} (ID: ${data.id})`);
          return true;
        }
      } catch (resendError) {
        console.warn('⚠️ Resend exception, falling back to Nodemailer:', resendError.message);
      }
    } else {
      console.warn('⚠️ RESEND_API_KEY not found. Attempting Nodemailer fallback directly.');
    }

    // Attempt 2: Nodemailer Fallback
    console.log(`[Email Service] Attempting Nodemailer fallback for ${to}...`);
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || "",
      html,
    });

    console.log(`✅ [Nodemailer] Successfully delivered to ${to} (MessageID: ${info.messageId})`);
    return true;

  } catch (finalError) {
    console.error('❌ Both Resend and Nodemailer failed to send email to', to, finalError);
    return false;
  }
};
