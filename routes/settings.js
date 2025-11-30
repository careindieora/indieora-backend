// routes/settings.js
import express from 'express';
import Setting from '../models/Setting.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// GET /api/settings  -> public (returns latest settings or empty)
router.get('/', async (req, res) => {
  try {
    const s = await Setting.findOne().sort({ createdAt: -1 }).lean();
    if (!s) return res.json({});
    res.json(s);
  } catch (err) {
    console.error("GET /api/settings error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/settings  -> admin only (update or create)
router.put('/', verifyToken, async (req, res) => {
  try {
    // require admin role
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const payload = req.body || {};
    let s = await Setting.findOne();
    if (!s) {
      s = new Setting(payload);
    } else {
      s.announcement = payload.announcement ?? s.announcement;
      s.logoUrl = payload.logoUrl ?? s.logoUrl;
      s.nav = Array.isArray(payload.nav) ? payload.nav : s.nav;
      s.categories = Array.isArray(payload.categories) ? payload.categories : s.categories;
    }
    await s.save();
    res.json(s);
  } catch (err) {
    console.error("PUT /api/settings error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
