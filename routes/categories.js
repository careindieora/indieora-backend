// indieora-backend/routes/categories.js
import express from 'express';
import Category from '../models/Category.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * GET /api/categories
 * Query params:
 *   ?page=&limit=&search=&status=&sort=order,-createdAt
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, sort = 'order,-createdAt' } = req.query;
    const q = {};
    if (search) q.$text = { $search: search };
    if (status) q.status = status;

    const skip = (Number(page)-1) * Number(limit);
    const items = await Category.find(q).sort(sort.split(',')).skip(skip).limit(Number(limit)).lean();
    const total = await Category.countDocuments(q);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('categories:list', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single by id (slug)
router.get('/:id', async (req, res) => {
  try {
    const c = await Category.findOne({ id: req.params.id }).lean();
    if (!c) return res.status(404).json({ message: 'Not found' });
    res.json(c);
  } catch (err) {
    console.error('categories:get', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const body = req.body;
    if (!body.id && body.title) body.id = body.title.toLowerCase().trim().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
    const c = new Category(body);
    await c.save();
    res.json(c);
  } catch (err) {
    console.error('categories:create', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const body = req.body;
    const updated = await Category.findOneAndUpdate({ id: req.params.id }, body, { new: true, upsert: false });
    res.json(updated);
  } catch (err) {
    console.error('categories:update', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await Category.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('categories:delete', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reorder categories (accepts array of ids in order)
router.post('/reorder', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { ids = [] } = req.body; // e.g. ["glass","clay","mugs"]
    let i = 0;
    for (const id of ids) {
      await Category.findOneAndUpdate({ id }, { order: i++ });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('categories:reorder', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
