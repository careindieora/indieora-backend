// routes/orders.js
import express from 'express';
import Order from '../models/Order.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Create order (public)
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const subtotal = Number(body.subtotal || 0);
    const total = subtotal; // taxes/shipping can be added later
    const o = new Order({ ...body, subtotal, total });
    await o.save();
    res.json({ success: true, orderId: o._id, order: o });
  } catch (err) {
    console.error('orders:create', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list orders
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const items = await Order.find().sort({ createdAt: -1 }).lean();
    res.json({ items });
  } catch (err) {
    console.error('orders:list', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: update order status
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ order: updated });
  } catch (err) {
    console.error('orders:update', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
