/**
 * Beautiful HTML Email Templates for GDG MMMUT
 * Clean, professional design with Google Blue
 * Uses bulletproof buttons for maximum email client compatibility
 */

const GDG_BLUE = '#4285f4';
const GDG_GREEN = '#1e8e3e';
const GDG_DARK = '#202124';
const GDG_GRAY = '#5f6368';
const GDG_LIGHT_GRAY = '#f8f9fa';

// Logo URL - using the deployed frontend URL
const GDG_LOGO = 'https://gdg.mmmut.app/gdg_logo.svg';

/**
 * Base email wrapper with GDG branding
 */
const baseTemplate = (content, options = {}) => {
  const { showFooter = true } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GDG MMMUT</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f3f4;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f1f3f4;">
<tr>
<td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">
<tr>
<td style="background-color:${GDG_BLUE};padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
<img src="${GDG_LOGO}" alt="GDG MMMUT" width="200" style="max-width:200px;height:auto;">
</td>
</tr>
<tr>
<td style="background-color:#ffffff;padding:40px;">
${content}
</td>
</tr>
${showFooter ? `
<tr>
<td style="background-color:${GDG_LIGHT_GRAY};padding:32px 40px;border-radius:0 0 16px 16px;text-align:center;">
<p style="margin:0 0 12px;font-size:14px;color:${GDG_GRAY};">Google Developers Group On Campus<br><strong>MMMUT Gorakhpur</strong></p>
<p style="margin:0;font-size:13px;"><a href="https://gdg.mmmut.app" style="color:${GDG_BLUE};text-decoration:none;">Website</a> | <a href="https://www.instagram.com/gdgmmmut" style="color:${GDG_BLUE};text-decoration:none;">Instagram</a> | <a href="https://www.linkedin.com/company/gdgoncampusmmmut/" style="color:${GDG_BLUE};text-decoration:none;">LinkedIn</a></p>
<p style="margin:16px 0 0;font-size:12px;color:#9aa0a6;">You received this email because you're a member of GDG MMMUT community.</p>
</td>
</tr>
` : ''}
</table>
</td>
</tr>
</table>
</body>
</html>`;
};

/**
 * Bulletproof button for email - VML fallback for Outlook
 */
const actionButton = (text, url, color = GDG_BLUE) => {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto;">
<tr>
<td bgcolor="${color}" style="border-radius:8px;">
<a href="${url}" target="_blank" style="background-color:${color};border-radius:8px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;">
${text}
</a>
</td>
</tr>
</table>`;
};

/**
 * Welcome Email Template
 */
const welcomeTemplate = (userName) => {
  const content = `
<h1 style="margin:0 0 16px;font-size:28px;font-weight:600;color:${GDG_DARK};text-align:center;">Welcome to GDG MMMUT! 🎉</h1>
<p style="margin:0 0 24px;font-size:16px;color:${GDG_GRAY};text-align:center;line-height:1.6;">Hey <strong>${userName}</strong>, we're thrilled to have you!</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8f0fe;border-radius:12px;margin:24px 0;">
<tr>
<td style="padding:24px;">
<p style="margin:0 0 16px;font-size:15px;color:${GDG_DARK};line-height:1.8;">As a member of Google Developers Group On Campus MMMUT, you'll get access to:</p>
<p style="margin:6px 0;font-size:14px;color:${GDG_DARK};">🚀 <strong>Exclusive Events</strong> - Workshops, hackathons, and tech talks</p>
<p style="margin:6px 0;font-size:14px;color:${GDG_DARK};">💡 <strong>Learning Resources</strong> - Curated content to boost your skills</p>
<p style="margin:6px 0;font-size:14px;color:${GDG_DARK};">🤝 <strong>Networking</strong> - Connect with fellow developers</p>
<p style="margin:6px 0;font-size:14px;color:${GDG_DARK};">🏆 <strong>Opportunities</strong> - Internships, projects, and more</p>
</td>
</tr>
</table>
${actionButton('Explore Events', 'https://gdg.mmmut.app/events')}
<p style="margin:24px 0 0;font-size:14px;color:${GDG_GRAY};text-align:center;">Got questions? Reply to this email or reach out at <a href="mailto:support@gdg.mmmut.app" style="color:${GDG_BLUE};">support@gdg.mmmut.app</a></p>`;

  return baseTemplate(content);
};

/**
 * Event Registration Confirmation Template
 */
const registrationTemplate = (userName, eventName, eventDate, registrationId) => {
  let formattedDate = 'Date TBD';
  try {
    if (eventDate) {
      const date = new Date(eventDate);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  } catch (e) {
    formattedDate = 'Date TBD';
  }

  const content = `
<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
<tr>
<td style="background-color:#e6f4ea;padding:12px 24px;border-radius:50px;">
<span style="color:${GDG_GREEN};font-weight:600;font-size:14px;">✓ Registration Confirmed</span>
</td>
</tr>
</table>
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:${GDG_DARK};text-align:center;">You're In! 🎊</h1>
<p style="margin:0 0 32px;font-size:16px;color:${GDG_GRAY};text-align:center;">Hey ${userName}, your spot is reserved!</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid #e8eaed;border-radius:16px;margin:24px 0;">
<tr>
<td style="padding:24px;">
<h2 style="margin:0 0 16px;font-size:20px;color:${GDG_DARK};border-bottom:2px solid ${GDG_BLUE};padding-bottom:12px;">📅 ${eventName}</h2>
<p style="margin:8px 0;"><span style="color:${GDG_GRAY};font-size:13px;">Date &amp; Time</span><br><strong style="color:${GDG_DARK};font-size:15px;">${formattedDate}</strong></p>
${registrationId ? `<p style="margin:8px 0;"><span style="color:${GDG_GRAY};font-size:13px;">Registration ID</span><br><strong style="color:${GDG_DARK};font-size:15px;font-family:monospace;">${registrationId}</strong></p>` : ''}
</td>
</tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fef7e0;border-left:4px solid #f9ab00;margin:24px 0;">
<tr>
<td style="padding:16px;">
<p style="margin:0;font-size:14px;color:${GDG_DARK};"><strong>📌 Quick Tips:</strong><br>• Add this event to your calendar<br>• Join 15 minutes early<br>• Keep your registration ID handy</p>
</td>
</tr>
</table>
${actionButton('View Event Details', 'https://gdg.mmmut.app/events', GDG_GREEN)}`;

  return baseTemplate(content);
};

/**
 * Qualification Email Template (for multi-round events)
 */
const qualificationTemplate = (userName, eventName, roundName, nextRoundDetails) => {
  const content = `
<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
<tr>
<td style="background-color:${GDG_BLUE};padding:16px 32px;border-radius:50px;">
<span style="color:white;font-weight:700;font-size:16px;">🏆 Congratulations!</span>
</td>
</tr>
</table>
<h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:${GDG_DARK};text-align:center;">You've Qualified!</h1>
<p style="margin:0 0 32px;font-size:16px;color:${GDG_GRAY};text-align:center;">Great job, ${userName}! Your hard work paid off.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#e8f0fe;border:2px solid ${GDG_BLUE};border-radius:16px;margin:24px 0;text-align:center;">
<tr>
<td style="padding:24px;">
<p style="margin:0 0 8px;font-size:14px;color:${GDG_GRAY};">Event</p>
<h2 style="margin:0 0 16px;font-size:22px;color:${GDG_DARK};">${eventName}</h2>
<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0">
<tr>
<td style="background-color:${GDG_GREEN};color:white;padding:8px 20px;border-radius:20px;font-weight:600;font-size:14px;">Qualified for ${roundName}</td>
</tr>
</table>
</td>
</tr>
</table>
${nextRoundDetails ? `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${GDG_LIGHT_GRAY};border-radius:12px;margin:24px 0;">
<tr>
<td style="padding:20px;">
<h3 style="margin:0 0 12px;font-size:16px;color:${GDG_DARK};">📋 Next Round Details</h3>
<p style="margin:0;font-size:15px;color:${GDG_GRAY};white-space:pre-wrap;line-height:1.6;">${nextRoundDetails}</p>
</td>
</tr>
</table>
` : ''}
${actionButton('View Competition', 'https://gdg.mmmut.app/events')}
<p style="margin:24px 0 0;font-size:14px;color:${GDG_GRAY};text-align:center;">Keep pushing! We're rooting for you. 💪</p>`;

  return baseTemplate(content);
};

/**
 * General Notification/Announcement Template
 */
const notificationTemplate = (title, message, options = {}) => {
  const { actionUrl, actionText } = options;
  const formattedMessage = String(message || '').replace(/\n/g, '<br>');

  const content = `
<h1 style="margin:0 0 24px;font-size:26px;font-weight:600;color:${GDG_DARK};text-align:center;">${title}</h1>
<div style="font-size:16px;color:${GDG_DARK};line-height:1.8;">${formattedMessage}</div>
${actionUrl && actionText ? actionButton(actionText, actionUrl) : ''}`;

  return baseTemplate(content);
};

/**
 * Newsletter Template
 */
const newsletterTemplate = (title, sections) => {
  let sectionsHtml = '';
  if (Array.isArray(sections)) {
    sectionsHtml = sections.map((section, index) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:${index > 0 ? '32px' : '0'} 0 0;">
<tr>
<td>
<h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:${GDG_DARK};border-left:4px solid ${GDG_BLUE};padding-left:12px;">${section.title}</h2>
<p style="margin:0;font-size:15px;color:${GDG_GRAY};line-height:1.7;">${section.content}</p>
</td>
</tr>
</table>`).join('');
  }

  const content = `
<h1 style="margin:0 0 32px;font-size:28px;font-weight:700;color:${GDG_DARK};text-align:center;">📰 ${title}</h1>
${sectionsHtml}
${actionButton('Visit Our Website', 'https://gdg.mmmut.app')}`;

  return baseTemplate(content);
};

/**
 * Induction Submission Confirmation Template
 */
const inductionSubmissionTemplate = (userName, formData) => {
  const content = `
<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
<tr>
<td style="background-color:#e6f4ea;padding:12px 24px;border-radius:50px;">
<span style="color:${GDG_GREEN};font-weight:600;font-size:14px;">✓ Application Received</span>
</td>
</tr>
</table>
<h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:${GDG_DARK};text-align:center;">Application Received! 🚀</h1>
<p style="margin:0 0 32px;font-size:16px;color:${GDG_GRAY};text-align:center;">Hi ${userName}, we've successfully received your induction application.</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:2px solid #e8eaed;border-radius:16px;margin:24px 0;">
<tr>
<td style="padding:24px;">
<h2 style="margin:0 0 16px;font-size:18px;color:${GDG_DARK};border-bottom:2px solid ${GDG_BLUE};padding-bottom:12px;">Your Application Summary</h2>
<p style="margin:8px 0;"><span style="color:${GDG_GRAY};font-size:13px;">Name</span><br><strong style="color:${GDG_DARK};font-size:14px;">${formData.firstName} ${formData.lastName}</strong></p>
<p style="margin:8px 0;"><span style="color:${GDG_GRAY};font-size:13px;">Roll Number</span><br><strong style="color:${GDG_DARK};font-size:14px;">${formData.rollNumber}</strong></p>
<p style="margin:8px 0;"><span style="color:${GDG_GRAY};font-size:13px;">Branch & Section</span><br><strong style="color:${GDG_DARK};font-size:14px;">${formData.branch} - ${formData.section}</strong></p>
<p style="margin:8px 0;"><span style="color:${GDG_GRAY};font-size:13px;">Domains Interested</span><br><strong style="color:${GDG_DARK};font-size:14px;">${(formData.domains || []).join(', ') || 'None'}</strong></p>
</td>
</tr>
</table>
<p style="margin:24px 0 0;font-size:14px;color:${GDG_GRAY};text-align:center;">Our core team is currently reviewing applications. Keep an eye on your inbox for updates regarding the next rounds!</p>`;

  return baseTemplate(content);
};

export {
  welcomeTemplate,
  registrationTemplate,
  qualificationTemplate,
  notificationTemplate,
  newsletterTemplate,
  inductionSubmissionTemplate,
  baseTemplate,
  actionButton,
  GDG_BLUE,
  GDG_DARK,
  GDG_GRAY,
  GDG_LOGO,
};
