import express from "express";
import mongoose from "mongoose";
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

    console.log(`[Chat] Fetching chats for user ${userId}, search: ${q || 'none'}`);
    const chats = await Chat.find(query).sort({ order: 1, updatedAt: -1 });
    res.json(chats);
  } catch (err: any) {
    console.error("[Chat List Error]", err.message);
    res.status(500).json({ error: "Failed to retrieve neural memories", details: err.message });
  }
});

router.post("/reorder", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { chatIds } = req.body; 

    console.log(`[Chat] Reordering ${chatIds?.length} chats for ${userId}`);
    const bulkOps = chatIds.map((id: string, index: number) => ({
      updateOne: {
        filter: { _id: id, userId },
        update: { $set: { order: index } }
      }
    }));

    await Chat.bulkWrite(bulkOps);
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Chat Reorder Error]", err.message);
    res.status(500).json({ error: "Dimensional reorder failure", details: err.message });
  }
});

router.post("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    console.log(`[Chat] Generating new session for ${userId}`);
    const chat = new Chat({ userId, messages: [] });
    await chat.save();
    res.json(chat);
  } catch (err: any) {
    console.error("[Chat Create Error]", err.message);
    res.status(500).json({ error: "Neural genesis failed", details: err.message });
  }
});

router.get("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid neural ID format" });
    }
    const chat = await Chat.findOne({ _id: req.params.id, userId });
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json(chat);
  } catch (err: any) {
    console.error("[Chat Detail Error]", err.message);
    res.status(500).json({ error: "Neural retrieval failure", details: err.message });
  }
});

router.patch("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { title, messages } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid session anchor" });
    }

    console.log(`[Chat] Patching chat ${req.params.id} for user ${userId}. Keys present:`, Object.keys(req.body));

    const update: any = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (messages !== undefined) update.messages = messages;

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: update },
      { new: true }
    );
    
    if (!chat) {
      console.warn(`[Chat] Patch failed: Chat ${req.params.id} not found for user ${userId}`);
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json(chat);
  } catch (err: any) {
    console.error(`[Chat Patch Error] ${req.params.id}:`, err.message);
    res.status(500).json({ error: "Failed to update neural record", details: err.message });
  }
});

router.delete("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid delete target" });
    }
    await Chat.deleteOne({ _id: req.params.id, userId });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Chat Delete Error]", err.message);
    res.status(500).json({ error: "Purge failed", details: err.message });
  }
});

export default router;
