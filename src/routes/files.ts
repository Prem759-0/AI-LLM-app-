import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { File } from "../models/File.ts";
import { User } from "../models/User.ts";

const router = express.Router();

router.get("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const files = await File.find({ userId }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const { name, size, type, content } = req.body;

    // Usage check
    const user = await User.findOne({ clerkId: userId });
    const limit = user?.isPro ? 100 : 4;
    const count = await File.countDocuments({ userId });

    if (count >= limit) {
      return res.status(403).json({ error: "File limit reached. Upgrade to Pro for more storage." });
    }

    const file = new File({
      userId,
      name,
      size,
      type,
      content
    });

    await file.save();
    
    // Update usage stats for quick lookups
    await User.findOneAndUpdate({ clerkId: userId }, { $set: { "usage.files": count + 1 } });
    
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    await File.deleteOne({ _id: req.params.id, userId });
    
    const count = await File.countDocuments({ userId });
    await User.findOneAndUpdate({ clerkId: userId }, { $set: { "usage.files": count } });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
