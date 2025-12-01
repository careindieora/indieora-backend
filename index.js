import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import authRoutes from './routes/auth.js';
import adminStatsRoutes from './routes/adminStats.js';
import adminAnalyticsRoutes from './routes/adminAnalytics.js';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);

app.get("/", (req, res) => {
  res.send("Indieora backend running");
});

// MONGO
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// SERVER — ✔ IMPORTANT: listens to ALL devices on network
const PORT = process.env.PORT || 5000;
app.listen(5000, "0.0.0.0", () => {
  console.log("Backend running on http://0.0.0.0:5000");
});
