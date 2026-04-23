import express from "express";
import mongoose from "mongoose";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { File } from "../models/File.ts";
import { User } from "../models/User.ts";
import crypto from "crypto";

const router = express.Router();

// Public route for shared files - MUST be before /:id for clarity or handled specifically
router.get("/shared/:shareId", async (req, res) => {
  try {
    const file = await File.findOne({ shareId: req.params.shareId, isShared: true });
    if (!file) {
      return res.status(404).json({ error: "Shared asset not found or access revoked" });
    }
    // Return only public fields
    res.json({
      name: file.name,
      type: file.type,
      size: file.size,
      content: file.content,
      createdAt: file.createdAt
    });
  } catch (err: any) {
    res.status(500).json({ error: "Link retrieval failed" });
  }
});

router.get("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access to neural vault" });
    }
    console.log(`[Files] Fetching assets for user ${userId}`);
    const files = await File.find({ userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err: any) {
    console.error("[Files List Error]", err.message);
    res.status(500).json({ error: "Failed to retrieve neural assets", details: err.message });
  }
});

router.post("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { name, size, type, content } = req.body;

    if (!name || content === undefined) {
      return res.status(400).json({ error: "Asset integrity failure: Missing name or content" });
    }

    // Usage check
    const user = await User.findOne({ clerkId: userId });
    const limit = user?.isPro ? 100 : 4;
    const count = await File.countDocuments({ userId });

    if (count >= limit) {
      console.warn(`[Files] User ${userId} reached storage ceiling (${count}/${limit})`);
      return res.status(403).json({ error: "Synthesis capacity reached. Upgrade for additional storage." });
    }

    console.log(`[Files] Synthesizing new asset: ${name} (${size}) for ${userId}`);
    const file = new File({
      userId,
      name,
      size,
      type,
      content
    });

    await file.save();
    
    // Update usage stats for quick lookups
    await User.findOneAndUpdate({ clerkId: userId }, { $set: { "usage.files": count + 1 } }, { new: true });
    
    res.json(file);
  } catch (err: any) {
    console.error("[Files Create Error]", err.message);
    res.status(500).json({ error: "Neural synthesis failure", details: err.message });
  }
});

router.delete("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid asset identifier" });
    }

    console.log(`[Files] Purging asset ${req.params.id} for user ${userId}`);
    const result = await File.deleteOne({ _id: req.params.id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Asset not found in the neural manifold" });
    }

    const count = await File.countDocuments({ userId });
    await User.findOneAndUpdate({ clerkId: userId }, { $set: { "usage.files": count } }, { new: true });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Files Delete Error]", err.message);
    res.status(500).json({ error: "Purge protocol failure", details: err.message });
  }
});

router.post("/:id/share", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const file = await File.findOne({ _id: req.params.id, userId });
    
    if (!file) {
      return res.status(404).json({ error: "Asset not found" });
    }

    if (!file.shareId) {
      file.shareId = crypto.randomBytes(16).toString("hex");
    }
    
    file.isShared = true;
    await file.save();

    res.json({ 
      shareId: file.shareId, 
      shareUrl: `${req.headers.origin}/shared/${file.shareId}` 
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate neural share link" });
  }
});

router.post("/:id/unshare", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isShared: false } },
      { new: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to revoke link access" });
  }
});

export default router;
