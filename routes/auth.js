// indieora-backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// helper: sign token
function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// helper: send OTP email (or console)
export async function sendOtpEmail(toEmail, otp) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: 'Your Indieora verification code',
      text: `Your OTP code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your OTP code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`
    });
  } else {
    // no SMTP configured — log for dev
    console.log(`[DEV OTP] sendOtpEmail -> ${toEmail} : ${otp}`);
  }
}

// POST /register
router.post('/register', async (req, res) => {
  console.log('--- register request hit ---');
  console.log('REGISTER BODY:', req.body);

  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    // create the user & OTP (save to DB)
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const user = new User({ name, email, phone, passwordHash: 'temp', otpCode: otp, otpExpires: Date.now() + 10*60*1000 });
    await user.save();

    // respond IMMEDIATELY
    res.json({ success: true, message: 'Registered. OTP will be sent shortly (dev-mode).' });

    // send email in background (non-blocking)
    (async () => {
      try {
        await sendOtpEmail(email, otp); // your helper
        console.log('Background OTP sent to', email);
      } catch (e) {
        console.error('Background send failed', e);
      }
    })();

  } catch (err) {
    console.error('auth:register error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/send-otp  (resend)
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email required' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(email, otp);
    res.json({ success: true, message: 'OTP resent' });
  } catch (err) {
    console.error('auth:send-otp', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: 'Email and otp required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.otpCode || !user.otpExpires) return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    if (user.otpCode !== otp) return res.status(400).json({ message: 'Invalid OTP' });

    // mark verified and clear otp
    user.emailVerified = true;
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    // Optionally sign token
    const token = signToken(user);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    console.error('auth:verify-otp', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// login unchanged (but we will allow only if emailVerified === true — optional)
// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    // optional: require verification
    if (!user.emailVerified) return res.status(403).json({ message: 'Email not verified. Please verify using the OTP sent to your email.' });

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    console.error('auth:login', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /me
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

// PUT /profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
      user.emailVerified = false; // require re-verification if email changed
      // generate OTP & sending not implemented here — you can call sendOtp if you want
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
