import { sendGlobalEmail } from "./unifiedEmail.js";

const sendMail = async (receiver, status) => {
  let mailSubject = "";
  let mailText = "";
  let mailHTML = "";

  if(status === "approved"){
    mailSubject = "🎉 Your Event Registration Has Been Approved!";
    mailText = `Hi${receiver.formData.fullName}`;
    mailHTML = `<div class="email-container">
    <div class="header">
      <h1>🎉 Registration Approved!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${receiver.formData.fullName}</strong>,</p>
      <p>Great news! Your registration for <strong>${receiver.event}</strong> has been successfully approved.</p>

      <div class="details">
        <p><strong>Event Name:</strong> ${receiver.event}</p>
        <p><strong>Date/Time:</strong> ${receiver.attendanceTime}</p>
      </div>

      <p>You’re all set to attend! We’re excited to have you join us for an amazing experience.</p>

      <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:gdgdeveloper2025@gmail.com">gdgdeveloper2025@gmail.com</a>.</p>

      <p>See you soon! 👋</p>
      <p>— The Google Developer Group</p>
    </div>
  </div>`;
  } else if (status === "rejected") {
    mailSubject = "⚠️ Registration Not Approved";
    mailText = "";
    mailHTML = `<div class="email-container">
    <div class="header">
      <h1>⚠️ Registration Not Approved</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${receiver.formData.fullName}</strong>,</p>
      <p>We appreciate your interest in <strong>${receiver.event}</strong>. Unfortunately, your registration could not be approved at this time.</p>

      <div class="details">
        <p><strong>Event Name:</strong> ${receiver.event}</p>
      </div>

      <p>This may be due to limited capacity or not meeting certain participation criteria. Please don’t be discouraged — we’d love to have you join us for future events!</p>

      <p>If you have any questions, feel free to reply to this email or contact us at <a href="mailto:gdgdeveloper2025@gmail.com">gdgdeveloper2025@gmail.com</a>.</p>

      <p>Thank you for your understanding.</p>
      <p>— The Google Developer Group</p>
    </div>
  </div>
`;
  }

  try {
    console.log(receiver);
    const success = await sendGlobalEmail({
      to: receiver.formData.email,
      subject: mailSubject,
      text: mailText,
      html: mailHTML,
    });

    return success ? "sent" : null;
  } catch (err) {
    console.error("Error while sending mail", err);
    return null;
  }
}

export default sendMail;