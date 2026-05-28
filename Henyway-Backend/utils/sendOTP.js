// utils/sendOTP.js
import { sendEmail } from "./sendEmail.js";

// Named export
export const sendOTPEmail = async ({ to, subject, text, html }) => {
  return sendEmail({ to, subject, text, html });
};
