// routes/settings.js
import express from 'express';
import Setting from '../models/Setting.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let s = await Setting.findOne().lean();
    if (!s) s = await Setting.create({});
    res.json(s);
  } catch(err){ console.error(err); res.status(500).json({message:'Server error'}); }
});

router.put('/', verifyToken, async (req, res) => {
  try {
    const body = req.body;
    let s = await Setting.findOne();
    if (!s) { s = new Setting(body); s.updatedBy = req.user?.id; await s.save(); return res.json(s); }
    s.siteTitle = body.siteTitle ?? s.siteTitle;
    s.headerText = body.headerText ?? s.headerText;
    s.logoUrl = body.logoUrl ?? s.logoUrl;
    s.updatedBy = req.user?.id;
    await s.save();
    res.json(s);
  } catch(err){ console.error(err); res.status(500).json({message:'Server error'}); }
});

export default router;
