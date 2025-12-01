// indieora-backend/models/Settings.js
import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  logo: { type: String, default: "" },
  headerTitle: { type: String, default: "Indieora" },
  headerSubtitle: { type: String, default: "" },
  themeColor: { type: String, default: "#000000" },
}, { timestamps: true });

export default mongoose.model("Settings", SettingsSchema);
