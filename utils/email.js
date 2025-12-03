// utils/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP credentials missing (SMTP_HOST, SMTP_USER, SMTP_PASS)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });
}

export async function sendOtpEmail(to, otp) {
  const transporter = createTransporter();
  const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Your Indieora verification code',
      text: `Your Indieora verification code is ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h2 style="margin-bottom: 8px;">Indieora — Verify your email</h2>
          <p>Use this code to verify your email. It expires in 5 minutes:</p>
          <div style="display:inline-block;padding:10px 16px;border-radius:8px;background:#f4f4f5;font-size:20px;font-weight:600;letter-spacing:4px;">
            ${otp}
          </div>
          <p style="margin-top:12px;font-size:12px;color:#6b7280;">
            If you didn’t request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    console.log('OTP email sent to', to, info.messageId);
  } catch (err) {
    console.error('sendOtpEmail error:', {
      message: err?.message,
      code: err?.code,
      response: err?.response,
    });
    throw err;
  }
}
