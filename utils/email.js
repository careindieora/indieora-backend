// indieora-backend/utils/email.js
import nodemailer from 'nodemailer';

const makeTransporter = () => {
  // using SMTP settings from env
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,       // e.g. care.indieora@gmail.com
      pass: process.env.SMTP_PASS,       // App password (16 chars, no spaces)
    },
    tls: {
      // allow self-signed certs if any (safe for dev)
      rejectUnauthorized: false,
    },
  });
};

export async function sendOtpEmail(to, otp) {
  try {
    const transporter = makeTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; line-height:1.4;">
        <h2 style="color:#2b2b2b;">Indieora — Your OTP</h2>
        <p>Your verification code is:</p>
        <div style="font-size:28px; font-weight:700; letter-spacing:4px; margin:12px 0;">
          ${otp}
        </div>
        <p>This code expires in 10 minutes.</p>
        <hr/>
        <small>If you didn't request this, ignore it.</small>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: 'Your Indieora verification code',
      html,
    });

    console.log('sendOtpEmail: sent to', to, 'messageId=', info?.messageId);
    return { ok: true, info };
  } catch (err) {
    console.error('sendOtpEmail ERROR:', err && err.message ? err.message : err);
    return { ok: false, error: err };
  }
}
