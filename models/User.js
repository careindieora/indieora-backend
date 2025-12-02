// indieora-backend/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: 'customer' },
  emailVerified: { type: Boolean, default: false },
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
