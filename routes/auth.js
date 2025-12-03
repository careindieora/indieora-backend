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

function createToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * POST /api/auth/register
 * Body: { name, email, password, phone }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ email: normEmail });

    if (user && user.verified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!user) {
      user = new User({
        name,
        email: normEmail,
        phone,
        passwordHash,
        verified: false,
      });
    } else {
      user.name = name || user.name;
      user.phone = phone || user.phone;
      user.passwordHash = passwordHash;
      user.verified = false;
    }

    await user.save();

    // generate + send OTP
    let otp;
    try {
      otp = await createAndSaveOtp(normEmail);
      sendOtpEmail(normEmail, otp).catch((err) => {
        console.error('sendOtpEmail failed (register):', err?.message || err);
      });
    } catch (err) {
      console.error('OTP generation/send failed:', err?.message || err);
      return res.status(500).json({ message: 'Failed to generate/send OTP' });
    }

    const payload = {
      success: true,
      message: 'Registered. OTP will be sent shortly.',
    };

    // DEBUG ONLY (optional):
    if (process.env.DEBUG_OTP_RESPONSE === 'true') {
      payload.debugOtp = otp;
    }

    return res.json(payload);
  } catch (err) {
    console.error('auth.register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// common handler for send-otp + resend-otp
async function handleSendOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });

    const normEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    const otp = await createAndSaveOtp(normEmail);
    sendOtpEmail(normEmail, otp).catch((err) => {
      console.error('sendOtpEmail failed (send-otp):', err?.message || err);
    });

    const payload = {
      success: true,
      message: 'OTP sent / resent successfully.',
    };
    if (process.env.DEBUG_OTP_RESPONSE === 'true') {
      payload.debugOtp = otp;
    }

    return res.json(payload);
  } catch (err) {
    console.error('auth.send-otp error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

router.post('/resend-otp', handleSendOtp);
router.post('/send-otp', handleSendOtp); // alias for old frontend

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    const normEmail = String(email).trim().toLowerCase();
    const check = await verifyOtp(normEmail, String(otp).trim());

    if (!check.ok) {
      return res.status(400).json({
        message: 'OTP verification failed',
        reason: check.reason || 'invalid',
      });
    }

    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verified = true;
    await user.save();

    const token = createToken(user);
    return res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('auth.verify-otp error:', err);
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
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.verified) {
      return res
        .status(401)
        .json({ message: 'Email not verified. Please verify with OTP.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('auth.login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
