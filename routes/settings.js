import express from "express";
import Settings from "../models/Settings.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Get settings
router.get("/", async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update settings
router.put("/", verifyToken, async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(req.body);
    } else {
      Object.assign(settings, req.body);
    }

    await settings.save();

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
