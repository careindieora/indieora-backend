// models/Category.js
import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: String,
  seo: {
    metaTitle: String,
    metaDescription: String,
  }
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
