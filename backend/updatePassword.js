// updatePassword.js
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";  // <-- make sure path is correct

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is undefined in .env");
    }
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB for password update.");

    const emailToUpdate = "shamzabacha03@gmail.com";
    const plainPassword = "Aimalaiman000555###";

    const user = await User.findOne({ email: emailToUpdate.toLowerCase() });
    if (!user) {
      console.log("User not found:", emailToUpdate);
      process.exit(0);
    }

    console.log("Found user. _id =", user._id.toString());

    // fill username if missing
    if (!user.username) {
      user.username = user.name || "HamzaBacha";
    }

    const saltRounds = 10;
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    user.password = hashed;

    await user.save();

    console.log("Password updated and hashed for user:", emailToUpdate);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error in updatePassword:", err);
    process.exit(1);
  }
}

run();
