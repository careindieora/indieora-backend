import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/email.js";

const router = express.Router();

// REGISTER (send OTP)
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already registered" });

    // HASH PASSWORD
    const hashed = await bcrypt.hash(password, 10);

    // GENERATE 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000);

    // CREATE TEMP USER (unverified)
    const newUser = new User({
      name,
      email,
      phone,
      password: hashed,
      otp,
      isVerified: false,
    });

    await newUser.save();

    // SEND OTP EMAIL
    await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: "Registered. OTP sent to your email.",
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.otp !== otp)
    return res.status(400).json({ message: "Incorrect OTP" });

  user.isVerified = true;
  user.otp = null;
  await user.save();

  res.json({ success: true, message: "OTP Verified" });
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // CHECK VERIFIED
    if (!user.isVerified)
      return res.status(403).json({ message: "You must verify your email first." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ success: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
