// indieora-backend/routes/adminAnalytics.js
import express from 'express';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/admin/analytics
 * Returns:
 * {
 *   totals: { products, categories, orders },
 *   sales: [{ date: "2025-11-24", revenue: 1200, orders: 3 }, ...],
 *   topProducts: [{ _id, title, price, images, sold }, ...]
 * }
 *
 * For now sales is dummy / inferred. If you have orders collection, replace logic.
 */
router.get('/', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    // categories model optional — if missing will send 0
    let totalCategories = 0;
    try {
      const Category = (await import('../models/Category.js')).default;
      totalCategories = await Category.countDocuments();
    } catch (e) {
      totalCategories = 0;
    }

    // Latest 6 products
    const latest = await Product.find().sort({ createdAt: -1 }).limit(6).lean();

    // Dummy sales series for last 14 days (if you have orders, replace with real aggregation)
    const days = 14;
    const sales = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      // generate deterministic-ish dummy revenue from product counts
      const revenue = Math.floor( (totalProducts || 1) * (Math.random()*200 + 50) );
      const orders = Math.max(0, Math.floor(revenue / 500));
      sales.push({ date: dateStr, revenue, orders });
    }

    // Top products placeholder: recent ones with a fake sold number
    const topProducts = latest.map((p, idx) => ({ ...p, sold: Math.floor(Math.random()*50) }));

    res.json({ totals: { products: totalProducts, categories: totalCategories, orders: 0 }, sales, topProducts, latest });
  } catch (err) {
    console.error('analytics error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
