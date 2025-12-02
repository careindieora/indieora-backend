// routes/products.js
import express from 'express';
import Product from '../models/Product.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// LIST: search, category, status, page, limit, sort
router.get('/', async (req, res) => {
  try {
    const { search, category, status, page = 1, limit = 12, sort = '-createdAt' } = req.query;
    const q = {};
    if (search) q.$text = { $search: search };
    if (category && category !== 'all') q.category = category;
    if (status) q.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(q).sort(sort).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(q)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('products:list', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const p = await Product.findOne({ slug: req.params.slug }).lean();
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) {
    console.error('products:get-by-slug', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ message: 'Not found' });
    res.json(p);
  } catch (err) {
    console.error('products:get', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const body = req.body;
    if (!body.slug && body.title) body.slug = body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const p = new Product({ ...body, createdBy: req.user.id });
    await p.save();
    res.json(p);
  } catch (err) {
    console.error('products:create', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const body = req.body;
    if (body.title && !body.slug) body.slug = body.title.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
    const updated = await Product.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('products:update', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// BULK update status (publish/unpublish)
router.put('/bulk/status', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { ids = [], status } = req.body;
    await Product.updateMany({ _id: { $in: ids } }, { $set: { status } });
    res.json({ success: true });
  } catch (err) {
    console.error('products:bulk-status', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('products:delete', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
