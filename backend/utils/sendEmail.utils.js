import { sendGlobalEmail } from "./unifiedEmail.js";

const formatEventDate = (value) => {
  if (!value) return "To be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "To be announced";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const sendMail = async (registration, status) => {
  if (!registration || !["approved", "rejected"].includes(status)) {
    return false;
  }

  const recipientEmail = registration.user?.email || registration.formData?.email;
  const fullName =
    registration.user?.name || registration.formData?.fullName || "Participant";
  const eventName = registration.event?.name || "GDG MMMUT Event";
  const eventDate = formatEventDate(registration.event?.date);

  if (!recipientEmail) {
    console.error("Registration email skipped: recipient email missing");
    return false;
  }

  let subject = "";
  let text = "";
  let html = "";

  if (status === "approved") {
    subject = "Your Event Registration Has Been Approved";
    text = `Hi ${fullName},\n\nYour registration for ${eventName} has been approved.\nEvent Date/Time: ${eventDate}\n\nSee you there!\nGDG MMMUT Team`;
    html = `
      <div>
        <h2>Registration Approved</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>Your registration for <strong>${eventName}</strong> has been approved.</p>
        <p><strong>Event Date/Time:</strong> ${eventDate}</p>
        <p>We are excited to have you with us.</p>
        <p>GDG MMMUT Team</p>
      </div>
    `;
  } else {
    subject = "Update on Your Event Registration";
    text = `Hi ${fullName},\n\nWe appreciate your interest in ${eventName}. Unfortunately, your registration could not be approved at this time.\n\nRegards,\nGDG MMMUT Team`;
    html = `
      <div>
        <h2>Registration Update</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>We appreciate your interest in <strong>${eventName}</strong>. Unfortunately, your registration could not be approved at this time.</p>
        <p>Thank you for your understanding.</p>
        <p>GDG MMMUT Team</p>
      </div>
    `;
  }

  try {
    return await sendGlobalEmail({
      to: recipientEmail,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("Error while sending registration email", err);
    return false;
  }
};

export default sendMail;