// utils/test-smtp.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // true if port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // add longer timeouts for debugging:
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });

  try {
    await transporter.verify();
    console.log('SMTP verify: OK');
  } catch (err) {
    console.error('SMTP verify error:', err && err.message ? err.message : err);
    process.exit(1);
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: 'sonivedang7@gmail.com', // change to a test recipient
      subject: 'Indieora test email',
      text: 'This is a test from Indieora backend',
    });
    console.log('sendMail ok:', info.messageId || info);
  } catch (err) {
    console.error('sendMail error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
