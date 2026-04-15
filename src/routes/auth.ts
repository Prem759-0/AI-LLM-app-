import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if DB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({ error: "Database connection is not ready. Please check your MongoDB Atlas IP whitelist." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const user = new User({ email, password, name });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Server error: " + (err.message || "Unknown error") });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if DB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({ error: "Database connection is not ready. Please check your MongoDB Atlas IP whitelist." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server error: " + (err.message || "Unknown error") });
  }
});

export default router;
