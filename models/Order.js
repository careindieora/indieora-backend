// models/Order.js
import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: String,
  title: String,
  qty: Number,
  price: Number,
  variant: Object
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  items: [OrderItemSchema],
  subtotal: Number,
  total: Number,
  status: { type: String, default: 'pending' }, // pending, paid, shipped, cancelled
  source: String, // 'frontend' or payment-gateway
  meta: Object
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
