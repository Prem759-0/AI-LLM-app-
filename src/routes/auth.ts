import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

router.post("/signup", async (req, res) => {
  console.log("[Auth] Signup attempt:", req.body.email);
  try {
    const { email, password, name } = req.body;
    
    // Detailed connection state check
    const readyState = mongoose.connection.readyState;
    if (readyState !== 1) {
      console.error("[Auth] Database not ready. State:", readyState);
      const states = ["disconnected", "connected", "connecting", "disconnecting"];
      return res.status(503).json({ 
        error: "Database connection state is: " + (states[readyState] || "unknown"),
        details: "Please ensure your MONGODB_URI is correct and your deployment IP is whitelisted (0.0.0.0/0 for Atlas)."
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("[Auth] Signup failed: User already exists");
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({ email, password, name });
    await user.save();
    console.log("[Auth] Signup successful for:", email);

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("[Auth] CRITICAL Signup Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message || "An unexpected error occurred on the server."
    });
  }
});

router.post("/login", async (req, res) => {
  console.log("[Auth] Login attempt:", req.body.email);
  try {
    const { email, password } = req.body;

    const readyState = mongoose.connection.readyState;
    if (readyState !== 1) {
      console.error("[Auth] Database not ready. State:", readyState);
      return res.status(503).json({ error: "Database not connected. Please try again in a moment." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("[Auth] Login failed: User not found");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("[Auth] Login failed: Incorrect password");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error("[Auth] CRITICAL Login Error:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      details: err.message || "An unexpected error occurred on the server."
    });
  }
});

export default router;
