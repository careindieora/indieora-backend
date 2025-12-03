// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  verified: { type: Boolean, default: false }, // whether OTP verified
  role: { type: String, default: 'customer' },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
