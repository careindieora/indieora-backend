// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import verifyToken from '../middleware/verifyToken.js';
import { sendOtpEmail } from '../utils/email.js'; // only this export

const router = express.Router();

// helper: sign JWT
function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Small OTP generator (6 digits)
function generateOtp() {
  return (Math.floor(100000 + Math.random() * 900000)).toString();
}

/**
 * POST /api/auth/register
 * - If email not present: create user + otp
 * - If email exists and not verified: update OTP and password (if provided)
 * - If email exists and verified: return 400 (already registered)
 * Responds quickly and sends email in background.
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    let user = await User.findOne({ email });

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    if (user && user.emailVerified) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (user && !user.emailVerified) {
      // Update existing unverified user
      user.otpCode = otp;
      user.otpExpires = otpExpires;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
      }
      user.name = name || user.name;
      user.phone = phone || user.phone;
      await user.save();
    } else {
      // New user
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      user = new User({
        name,
        email,
        phone,
        passwordHash,
        emailVerified: false,
        otpCode: otp,
        otpExpires
      });
      await user.save();
    }

    // Respond quickly so frontend doesn't wait for email
    res.json({ success: true, message: 'Registered. OTP will be sent shortly.' });

    // Send OTP in background (non-blocking)
    (async () => {
      try {
        await sendOtpEmail(user.email, otp);
        console.log('OTP sent (background) to', user.email);
      } catch (err) {
        console.error('Background sendOtpEmail failed for', user.email, err && err.message ? err.message : err);
      }
    })();

  } catch (err) {
    console.error('auth:register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/send-otp
 * Resend OTP for existing (unverified) user.
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    try {
      await sendOtpEmail(email, otp);
      return res.json({ success: true, message: 'OTP resent' });
    } catch (err) {
      console.error('send-otp send failed', err);
      return res.status(500).json({ message: 'Failed to send OTP' });
    }
  } catch (err) {
    console.error('auth:send-otp', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and mark emailVerified true, then return JWT + user info.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and otp required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otpCode || !user.otpExpires) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    if (Date.now() > new Date(user.otpExpires).getTime()) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    if (user.otpCode !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const token = signToken(user);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error('auth:verify-otp', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.emailVerified) return res.status(403).json({ message: 'Email not verified. Please verify using the OTP sent to your email.' });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error('auth:login', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * Protected
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, emailVerified: user.emailVerified } });
  } catch (err) {
    console.error('auth:me', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Protected: update name/email/phone
 * If email changed, mark emailVerified=false (optionally send OTP)
 */
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
      user.emailVerified = false; // require re-verification
      // optionally generate OTP & send via /send-otp endpoint
    }
    if (name) user.name = name;
    if (phone) user.phone = phone;

    await user.save();
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, emailVerified: user.emailVerified } });
  } catch (err) {
    console.error('auth:profile', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
