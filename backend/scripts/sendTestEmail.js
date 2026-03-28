import 'dotenv/config';
import { sendGlobalEmail } from '../utils/unifiedEmail.js';

const recipient = process.argv[2] || 'amiteshvishwakarma2006@gmail.com';
const from =
  process.argv[3] ||
  process.env.TEST_FROM_EMAIL ||
  '"GDG MMMUT" <team@gdg.mmmut.app>';
const requireResend = process.argv.includes('--resend-only');
const timestamp = new Date().toISOString();

const subject = `GDG Mail Delivery Test - ${timestamp}`;
const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2>GDG MMMUT Email Test</h2>
    <p>This is a test email sent from <strong>${from}</strong>.</p>
    <p>Timestamp: ${timestamp}</p>
    <p>If you received this, outbound email is working for this environment.</p>
  </div>
`;
const text = `GDG MMMUT Email Test\n\nThis is a test email sent from ${from}.\nTimestamp: ${timestamp}\n`;

console.log(`[Email Test] Sending test email to ${recipient} from ${from}`);
if (requireResend) {
  console.log('[Email Test] Resend-only mode enabled');
}

const sent = await sendGlobalEmail({
  to: recipient,
  subject,
  html,
  text,
  from,
  requireResend,
});

if (sent) {
  console.log('[Email Test] ✅ sendGlobalEmail returned success.');
  process.exit(0);
}

console.error('[Email Test] ❌ sendGlobalEmail returned failure.');
process.exit(1);
