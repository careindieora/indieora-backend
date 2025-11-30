// models/Category.js
import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g. 'glass'
  title: { type: String, required: true },            // e.g. 'Glass'
  slug: { type: String, index: true },
  description: String,
  seo: {
    metaTitle: String,
    metaDescription: String,
  }
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
