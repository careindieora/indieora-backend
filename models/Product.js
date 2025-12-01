// models/Product.js
import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  title: String,        // e.g. "Color: Terracotta"
  sku: String,
  price: Number,
  inventory: { type: Number, default: 0 },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  category: String,
  images: { type: [String], default: [] },   // multi images
  thumbnail: String,
  inventory: { type: Number, default: 0 },   // total stock (optional)
  variants: { type: [VariantSchema], default: [] },
  status: { type: String, enum: ['draft','published'], default: 'draft' },
  tags: { type: [String], default: [] },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogImage: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ProductSchema.index({ title: 'text', description: 'text', 'seo.metaTitle': 'text' });

export default mongoose.model('Product', ProductSchema);
