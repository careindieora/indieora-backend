// indieora-backend/models/Settings.js
import mongoose from 'mongoose';

const MenuLinkSchema = new mongoose.Schema({
  id: String,
  title: String,
  url: String,
  openInNewTab: { type: Boolean, default: false }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Indieora' },
  tagline: { type: String, default: 'Handmade & Custom' },

  logo: { type: String, default: '' },       // logo image URL
  favicon: { type: String, default: '' },    // favicon URL

  header: {
    showSearch: { type: Boolean, default: true },
    showCart: { type: Boolean, default: true },
    menu: { type: [MenuLinkSchema], default: [] }
  },

  footer: {
    contentHtml: { type: String, default: '' },
    links: { type: [MenuLinkSchema], default: [] },
    contact: {
      email: String,
      phone: String,
      address: String
    }
  },

  social: {
    instagram: String,
    facebook: String,
    youtube: String,
    whatsapp: String
  },

  theme: {
    preset: { type: String, default: 'clay' },
    colors: {
      clay1: { type: String, default: '#f5efe7' },
      clay2: { type: String, default: '#e6d3c1' },
      clay3: { type: String, default: '#c79b7a' },
      clay4: { type: String, default: '#8b5a3c' }
    }
  }
}, { timestamps: true });

export default mongoose.model('Settings', SettingsSchema);
