// utils/otp.js
import bcrypt from 'bcryptjs';
import Otp from '../models/Otp.js';

const SALT_ROUNDS = 10;

export async function createAndSaveOtp(email, ttlSeconds = 300) {
  // produce 6-digit numeric OTP as string
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // Save OTP record
  await Otp.create({ email, otpHash, expiresAt });

  return otp;
}

/**
 * Verify OTP for email.
 * Returns { ok: boolean, reason?: string }
 */
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

/**
 * Optionally: clean up old otps (not required here) — keep as reference.
 */
export async function cleanupExpiredOtps() {
  await Otp.deleteMany({ expiresAt: { $lt: new Date() } });
}
