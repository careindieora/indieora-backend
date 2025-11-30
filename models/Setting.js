// models/Setting.js
import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
  siteTitle: { type: String, default: 'Indieora' },
  headerText: { type: String, default: 'Handmade & Custom' },
  logoUrl: { type: String, default: '' }, // Cloudinary or external URL
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Setting', SettingSchema);
