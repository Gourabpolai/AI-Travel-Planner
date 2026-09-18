const nodemailer = require("nodemailer");

/**
 * Creates a transporter for sending emails.
 * If SMTP credentials are provided in env, it uses them.
 * Otherwise, it falls back to creating an Ethereal test account automatically.
 */
const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback to Ethereal Email for development
  console.log("No SMTP config found. Generating Ethereal test account...");
  const testAccount = await nodemailer.createTestAccount();
  
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
};

/**
 * Send an OTP email to the user
 */
const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: '"TripSync AI Travel Planner" <noreply@tripsync.com>',
      to: email,
      subject: "TripSync Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a; text-align: center;">Welcome to TripSync!</h2>
          <p style="color: #475569; font-size: 16px;">Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address and complete your registration:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0284c7;">${otp}</span>
          </div>
          <p style="color: #475569; font-size: 14px;">This code is valid for 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);
    
    // Preview only available when sending through an Ethereal account
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

module.exports = {
  sendOTPEmail,
};
