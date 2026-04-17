import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./src/routes/auth";
import chatRoutes from "./src/routes/chat";
import aiRoutes from "./src/routes/ai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Standard Middleware (Synchronous)
app.use(express.json());
app.use(cors());

// Logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Root API health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    environment: process.env.NODE_ENV,
    dbConnected: mongoose.connection.readyState === 1
  });
});

// API Routes (Synchronous mount)
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);

// Catch unmatched API routes
app.all("/api/*", (req, res) => {
  console.error(`[API 404] No handler for: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: "API endpoint not found",
    path: req.path,
    method: req.method
  });
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

// Export for serverless (Vercel)
export default app;

async function bootstrap() {
  // Connect to MongoDB (Non-blocking for the routes)
  if (process.env.MONGODB_URI) {
    try {
      // mongoose.connect returns a promise, we handle it but don't stop the app
      mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("Connected to MongoDB Atlas"))
        .catch(err => console.error("MongoDB Atlas connection error:", err));
    } catch (err) {
      console.error("Immediate MongoDB error:", err);
    }
  } else {
    console.warn("MONGODB_URI not found. Database features will be restricted.");
  }

  // Vite/Static serving setup
  if (process.env.NODE_ENV !== "production") {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Vite server error:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start the server for local development/AI Studio
  const PORT = 3000;
  // Use a simple check to determine if we should start listening
  // In Vercel, this file is imported, so we don't need to listen
  if (process.env.NODE_ENV !== "production" || process.env.RENDER || process.env.RAILWAY_STATIC_URL || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server executing on http://localhost:${PORT}`);
    });
  }
}

bootstrap();
