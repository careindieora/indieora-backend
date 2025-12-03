// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import User from '../models/User.js';
import { createAndSaveOtp, verifyOtp } from '../utils/otp.js';
import { sendOtpEmail } from '../utils/email.js';

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const JWT_EXPIRES = '7d';

// Helper to create JWT
function createToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * POST /api/auth/register
 * Body: { name, email, password, phone }
 * Creates user (if new) or re-sends OTP if already unverified.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // Normalize email
    const normEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ email: normEmail });

    if (user && user.verified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!user) {
      user = new User({ name, email: normEmail, phone, passwordHash, verified: false });
      await user.save();
    } else {
      // update passwordHash and name/phone in case user existed as unverified
      user.passwordHash = passwordHash;
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    }

    // Create OTP and send email (background)
    try {
      const otp = await createAndSaveOtp(normEmail);
      // Send email but do not block response too long — await so we get failures in logs
      sendOtpEmail(normEmail, otp).catch(err => {
        // already logged in utils/email, but log contextually
        console.error('sendOtpEmail failed (register):', err?.message || err);
      });
    } catch (err) {
      console.error('OTP generation/send failed:', err?.message || err);
      // We still respond 200 with message to avoid leaking info
      return res.status(500).json({ message: 'Failed to generate/send OTP' });
    }

    return res.json({ success: true, message: 'Registered. OTP will be sent shortly (dev-mode).' });
  } catch (err) {
    console.error('auth.register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * On success: mark user verified and return token + user
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

    const normEmail = String(email).trim().toLowerCase();

    const check = await verifyOtp(normEmail, String(otp).trim());
    if (!check.ok) {
      const reason = check.reason || 'invalid';
      return res.status(400).json({ message: 'OTP verification failed', reason });
    }

    // Mark user as verified
    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verified = true;
    await user.save();

    const token = createToken(user);
    return res.json({ success: true, token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('auth.verify-otp error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Body: { email }
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });
    const normEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verified) return res.status(400).json({ message: 'User already verified' });

    const otp = await createAndSaveOtp(normEmail);
    sendOtpEmail(normEmail, otp).catch(err => console.error('sendOtpEmail failed (resend):', err?.message || err));

    return res.json({ success: true, message: 'OTP resent (if delivery allowed).' });
  } catch (err) {
    console.error('auth.resend-otp error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // If user exists but not verified, require verification first
    if (!user.verified) return res.status(401).json({ message: 'Email not verified. Please verify with OTP.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createToken(user);
    return res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('auth.login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
