// models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  category: String,
  images: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  seo: {
    metaTitle: String,
    metaDescription: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);
