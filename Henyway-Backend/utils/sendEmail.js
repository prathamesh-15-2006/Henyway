// Named export
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
      throw new Error("Email credentials not configured. Please set BREVO_API_KEY and EMAIL_FROM in your environment variables.");
    }

    const payload = {
      sender: {
        email: process.env.EMAIL_FROM,
      },
      to: [
        {
          email: to,
        },
      ],
      subject,
      htmlContent: html || text,
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("Email sent:", data.messageId);
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(error.message);
  }
};
