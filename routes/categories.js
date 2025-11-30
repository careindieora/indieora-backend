// routes/categories.js
import express from 'express';
import Category from '../models/Category.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// list (public)
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find().sort({ title: 1 });
    res.json(cats);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// create (admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const payload = req.body;
    const c = new Category(payload);
    await c.save();
    res.json(c);
  } catch (err) { res.status(500).json({ message: 'Server error', err }); }
});

// update
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const updated = await Category.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, upsert: false });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

// delete
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await Category.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
});

export default router;
