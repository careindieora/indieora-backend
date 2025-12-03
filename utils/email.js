// utils/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create transporter with environment variables
// Supports Gmail (smtp.gmail.com) or any SMTP provider via env.
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP credentials not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports (use STARTTLS)
    auth: { user, pass },
    // increase timeouts for remote hosts
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });
}

/**
 * Send OTP email
 * @param {string} to recipient email
 * @param {string} otp numeric OTP string
 */
export async function sendOtpEmail(to, otp) {
  const transporter = createTransporter();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

  const subject = 'Your Indieora verification code';
  const text = `Your Indieora verification code is ${otp}. It expires in 5 minutes.`;
  const html = `
    <div style="font-family: Inter, system-ui, Arial, sans-serif; line-height:1.4; color:#111">
      <h2 style="margin:0 0 8px">Indieora — Email verification</h2>
      <p style="margin:0 0 12px">Use the following code to verify your email address. It will expire in 5 minutes.</p>
      <div style="display:inline-block; padding:10px 16px; font-size:20px; letter-spacing:4px; border-radius:8px; background:#f7f7f7; color:#111; font-weight:600;">
        ${otp}
      </div>
      <p style="margin-top:16px; color:#666; font-size:13px">If you did not request this code, you can ignore this email.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    // nodemailer returns messageId on success
    console.log(`OTP sent (background) to ${to}`, info && info.messageId ? info.messageId : '');
    return info;
  } catch (err) {
    // helpful debug info in logs
    console.error('sendOtpEmail error:', {
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    throw err;
  }
}
