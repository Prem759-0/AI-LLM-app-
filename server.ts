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

// Standard Middleware
app.use(express.json());
app.use(cors());

// Database connection helper for serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is missing!");
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
  }
};

// Middleware to ensure DB is connected for API routes
app.use("/api", async (req, res, next) => {
  await connectDB();
  next();
});

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
    dbConnected: mongoose.connection.readyState === 1,
    vercel: !!process.env.VERCEL
  });
});

// API Routes
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

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Global Error Handler]", err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message || "Unknown global error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// Export for serverless (Vercel)
export default app;

async function bootstrap() {
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
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server executing on http://localhost:${PORT}`);
    });
  }
}

bootstrap();
