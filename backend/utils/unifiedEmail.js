import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const formatFrom = (name, email) => `"${name}" <${email}>`;

const extractEmailAddress = (value = '') => {
  const text = String(value).trim();
  if (!text) return '';
  const match = text.match(/<([^>]+)>/);
  return (match?.[1] || text).trim();
};

const likelySenderPolicyError = (error) => {
  const msg = `${error?.message || ''}`.toLowerCase();
  return (
    msg.includes('sender') ||
    msg.includes('from') ||
    msg.includes('not authorized') ||
    msg.includes('mail from') ||
    msg.includes('address rejected')
  );
};

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'team@gdg.mmmut.app';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'GDG MMMUT';
const SMTP_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL ||
  process.env.NODEMAILER_FROM_EMAIL ||
  process.env.NODEMAILER_EMAIL ||
  process.env.SMTP_USERNAME ||
  process.env.SMTP_USER ||
  '';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || RESEND_FROM_NAME;

// Initialize Resend conditionally to prevent crash if API key is missing.
// Use global key first, then optional IMMERSE key as fallback.
const resendApiKey =
  process.env.RESEND_API_KEY?.trim() ||
  process.env.IMMERSE_RESEND_API_KEY?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
  from = formatFrom(RESEND_FROM_NAME, RESEND_FROM_EMAIL),
  requireResend = false,
}) => {
  try {
    let resendErrorMessage = '';

    // Attempt 1: Resend
    if (resendApiKey) {
      try {
        const { data, error } = await resend.emails.send({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text: text || "",
        });

        if (error) {
          resendErrorMessage = error.message || 'Resend returned an error';
          console.warn('⚠️ Resend failed, falling back to Nodemailer:', error.message);
        } else {
          console.log(`✅ Email sent via Resend to ${to} (ID: ${data.id})`);
          return true;
        }
      } catch (resendError) {
        resendErrorMessage = resendError.message || 'Resend exception';
        console.warn('⚠️ Resend exception, falling back to Nodemailer:', resendError.message);
      }
    } else {
      resendErrorMessage = 'No Resend API key found in environment';
      console.warn('⚠️ No Resend API key found. Attempting Nodemailer fallback directly.');
    }

    if (requireResend) {
      console.error(`❌ Resend-only email policy enabled. Email to ${to} was not sent. Reason: ${resendErrorMessage}`);
      return false;
    }

    // Attempt 2: Nodemailer Fallback
    console.log(`[Email Service] Attempting Nodemailer fallback for ${to}...`);
    let info;

    try {
      info = await transporter.sendMail({
        from,
        to,
        subject,
        text: text || "",
        html,
      });
    } catch (smtpError) {
      const requestedFrom = extractEmailAddress(from);
      const smtpIdentity = extractEmailAddress(SMTP_FROM_EMAIL);

      if (
        smtpIdentity &&
        requestedFrom &&
        smtpIdentity.toLowerCase() !== requestedFrom.toLowerCase() &&
        likelySenderPolicyError(smtpError)
      ) {
        const smtpFrom = formatFrom(SMTP_FROM_NAME, smtpIdentity);
        console.warn(
          `[Email Service] Sender policy rejected from=${requestedFrom}. Retrying Nodemailer with SMTP identity ${smtpIdentity}.`,
        );

        info = await transporter.sendMail({
          from: smtpFrom,
          to,
          subject,
          text: text || "",
          html,
        });
      } else {
        throw smtpError;
      }
    }

    console.log(`✅ [Nodemailer] Successfully delivered to ${to} (MessageID: ${info.messageId})`);
    return true;

  } catch (finalError) {
    console.error('❌ Both Resend and Nodemailer failed to send email to', to, finalError);
    return false;
  }
};
