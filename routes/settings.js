// routes/settings.js
import express from 'express';
import Settings from '../models/Settings.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// GET settings (public)
router.get('/', async (req, res) => {
  try {
    let s = await Settings.findOne().lean();
    if (!s) {
      s = new Settings();
      await s.save();
      s = s.toObject();
    }
    res.json(s);
  } catch (err) {
    console.error('settings:get', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update settings (protected)
router.put('/', verifyToken, async (req, res) => {
  try {
    // optional: restrict to admin role
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    let s = await Settings.findOne();
    if (!s) s = new Settings(req.body);
    else Object.assign(s, req.body);

    await s.save();
    res.json({ success: true, settings: s });
  } catch (err) {
    console.error('settings:update', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
