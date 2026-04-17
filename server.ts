import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./src/routes/auth.ts";
import chatRoutes from "./src/routes/chat.ts";
import aiRoutes from "./src/routes/ai.ts";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Connect to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.warn("MONGODB_URI not found in environment variables. Database features will be disabled.");
  }

  app.use(express.json());

  // Root API healthy check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV });
  });

  // Logging middleware for debugging routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/ai", aiRoutes);

  // Catch unmatched API routes to prevent Vite from handling them with 404
  app.all("/api/*", (req, res) => {
    console.error(`[API 404] No handler for: ${req.method} ${req.path}`);
    res.status(404).json({ 
      error: "API endpoint not found",
      path: req.path,
      method: req.method
    });
  });

  // Serve a dummy favicon if missing to prevent 404 clutter
  app.get("/favicon.ico", (req, res) => res.status(204).end());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
