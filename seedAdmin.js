import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to DB");

    const email = "admin@indieora.com";
    const password = "Indieora123";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name: "Admin",
      email,
      passwordHash,
      role: "admin",
    });

    console.log("Admin created successfully!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
