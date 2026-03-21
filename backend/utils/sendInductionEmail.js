import { qualificationTemplate } from "./emailTemplates.js";
import { sendGlobalEmail } from "./unifiedEmail.js";

export const sendInductionRoundEmail = async (email, firstName, roundName, nextRoundDetails) => {
  try {
    const html = qualificationTemplate(
      firstName, 
      "GDG MMMUT Induction 2026", 
      roundName, 
      nextRoundDetails
    );
    
    await sendGlobalEmail({
      to: email,
      subject: `🎉 Congratulations! You qualified for ${roundName}`,
      html: html,
    });
    
    return true;
  } catch (err) {
    console.error("Error sending induction qualification email:", err);
    return false;
  }
};
