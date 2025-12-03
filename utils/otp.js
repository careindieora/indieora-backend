// utils/otp.js
import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';

const SALT_ROUNDS = 10;

// Generate + save OTP, return plain code
export async function createAndSaveOtp(email, ttlSeconds = 300) {
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await Otp.create({ email, otpHash, expiresAt });

  return otp;
}

// Check OTP for email
export async function verifyOtp(email, otp) {
  const record = await Otp.findOne({ email, used: false }).sort({ createdAt: -1 });
  if (!record) return { ok: false, reason: 'no_otp' };
  if (record.expiresAt < new Date()) return { ok: false, reason: 'expired' };

  const match = await bcrypt.compare(otp, record.otpHash);
  if (!match) return { ok: false, reason: 'invalid' };

  record.used = true;
  await record.save();
  return { ok: true };
}
