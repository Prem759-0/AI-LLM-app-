import express from "express";
import jwt from "jsonwebtoken";
import { Chat } from "../models/Chat";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Middleware to verify JWT
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

router.get("/", authenticate, async (req: any, res) => {
  try {
    const { q } = req.query;
    const query: any = { userId: req.userId };
    
    if (q) {
      query.title = { $regex: q, $options: "i" };
    }

    const chats = await Chat.find(query).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authenticate, async (req: any, res) => {
  try {
    const chat = new Chat({ userId: req.userId, messages: [] });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", authenticate, async (req: any, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", authenticate, async (req: any, res) => {
  try {
    const { title, messages } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { title, messages, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authenticate, async (req: any, res) => {
  try {
    await Chat.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
