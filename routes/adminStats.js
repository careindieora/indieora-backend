import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCategories = await Category.countDocuments();

    const latest = await Product.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const stats = {
      products: totalProducts,
      categories: totalCategories,
      orders: 0
    };

    res.json({ stats, latest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Stats error' });
  }
});

export default router;
