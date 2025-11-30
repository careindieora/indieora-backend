// models/Setting.js
import mongoose from 'mongoose';

const NavItem = new mongoose.Schema({ title: String, href: String }, { _id: false });
const CategoryItem = new mongoose.Schema({ id: String, title: String }, { _id: false });

const SettingSchema = new mongoose.Schema({
  announcement: { type: String, default: "" },
  logoUrl: { type: String, default: "" },
  nav: { type: [NavItem], default: [] },
  categories: { type: [CategoryItem], default: [] },
}, { timestamps: true });

export default mongoose.model('Setting', SettingSchema);
