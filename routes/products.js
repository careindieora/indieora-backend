// routes/products.js
import express from 'express';
import Product from '../models/Product.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// list with search, category, page, limit
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const q = {};
    if (search) q.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'seo.metaTitle': { $regex: search, $options: 'i' } },
      { tags: { $in: [ new RegExp(search, 'i') ] } }
    ];
    if (category && category !== 'all') q.category = category;
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(q)
    ]);
    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// get single
router.get('/:id', async (req, res) => {
  try { const p = await Product.findById(req.params.id); if(!p) return res.status(404).json({message:'Not found'}); res.json(p); }
  catch(err){ console.error(err); res.status(500).json({message:'Server error'}); }
});

// create
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const body = req.body;
    if (!body.slug && body.title) body.slug = body.title.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
    const p = new Product({ ...body, createdBy: req.user.id });
    await p.save();
    res.json(p);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// update
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const body = req.body;
    if (body.title && !body.slug) body.slug = body.title.toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]+/g,'');
    const updated = await Product.findByIdAndUpdate(req.params.id, body, { new: true });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// delete
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

export default router;
