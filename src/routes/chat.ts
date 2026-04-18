import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { Chat } from "../models/Chat.ts";

const router = express.Router();

router.get("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { q } = req.query;
    const query: any = { userId };
    
    if (q) {
      query.title = { $regex: q, $options: "i" };
    }

    const chats = await Chat.find(query).sort({ order: 1, updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reorder", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { chatIds } = req.body; // array of ids in order

    const bulkOps = chatIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order: index } }
      }
    }));

    await Chat.bulkWrite(bulkOps);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const chat = new Chat({ userId, messages: [] });
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { title, messages } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { title, messages, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    await Chat.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
