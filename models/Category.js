// indieora-backend/models/Category.js
import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // slug / short id e.g. "glass"
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },      // image URL (Cloudinary)
  order: { type: Number, default: 0 }, // for sorting
  status: { type: String, enum: ['active','inactive'], default: 'active' },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
    ogImage: String,
  },
}, { timestamps: true });

CategorySchema.index({ title: 'text', description: 'text' });

export default mongoose.model('Category', CategorySchema);
