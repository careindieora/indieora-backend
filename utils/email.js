// utils/email.js
import nodemailer from 'nodemailer';

/**
 * sendOtpEmail(to, otp)
 * Uses SMTP credentials from env vars:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
 *
 * NOTE: on Render/other hosts use a proper SMTP provider or Gmail app password.
 */
export async function sendOtpEmail(to, otp) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: 'Your Indieora OTP Code',
      html: `
        <div style="font-family: sans-serif; line-height: 1.4;">
          <h2 style="margin-bottom:6px;">Hello from Indieora</h2>
          <p>Your OTP code is:</p>
          <p style="font-size:20px; font-weight:700; letter-spacing:1px;">${otp}</p>
          <p style="color:#666; font-size:12px;">This code will expire in 10 minutes.</p>
        </div>
      `,
    });

    console.log('sendOtpEmail ok:', info.messageId || info.accepted);
    return { ok: true, info };
  } catch (err) {
    console.error('sendOtpEmail error:', err && err.message ? err.message : err);
    // don't throw — auth route uses background sending; but you can surface errors if desired
    return { ok: false, error: err };
  }
}
