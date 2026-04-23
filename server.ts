import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node";
import chatRoutes from "./src/routes/chat.ts";
import aiRoutes from "./src/routes/ai.ts";
import billingRoutes from "./src/routes/billing.ts";
import fileRoutes from "./src/routes/files.ts";

dotenv.config();

// Clerk v5 require CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in the environment.
// In some environments, users might prefix them with VITE_ even for the backend.
if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.VITE_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;
}
if (!process.env.CLERK_SECRET_KEY && process.env.VITE_CLERK_SECRET_KEY) {
  process.env.CLERK_SECRET_KEY = process.env.VITE_CLERK_SECRET_KEY;
}

if (!process.env.CLERK_SECRET_KEY) {
  console.error("CRITICAL: CLERK_SECRET_KEY is missing! Neural synthesis authentication will fail. Check environment variables.");
} else {
  console.log(`[Auth] Clerk Secret Key initialized: ${process.env.CLERK_SECRET_KEY.slice(0, 7)}...`);
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("WARNING: STRIPE_SECRET_KEY is missing! Financial checkout protocols are disabled.");
}

if (!process.env.MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI is missing! The neural database cannot be hydrated. Synthesis and memory will be lost.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Stripe Webhook (needs raw body, MUST be before express.json)
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).send("Webhook Error: Missing signature or secret");
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2024-11-20.acacia" as any,
    });
    const event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);

    const { User } = await import("./src/models/User.ts");

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        await User.findOneAndUpdate(
          { clerkId: session.metadata.clerkId },
          { 
            isPro: true, 
            stripeCustomerId: session.customer, 
            subscriptionId: session.subscription,
            email: session.customer_details?.email 
          },
          { upsert: true, new: true }
        );
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await User.findOneAndUpdate(
          { subscriptionId: sub.id },
          { isPro: false },
          { new: true }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Standard Middleware
app.use(express.json());
app.use(cors());

// Add a simple error logger
app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function(data) {
    if (res.statusCode >= 400) {
      console.error(`[API Error] ${req.method} ${req.path} -> ${res.statusCode}:`, JSON.stringify(data, null, 2));
    }
    return oldJson.call(this, data);
  };
  next();
});

// Middleware to log environment health
app.use("/api", (req, res, next) => {
  if (!process.env.MONGODB_URI) {
    console.error("[Backend] CRITICAL: MONGODB_URI is totally missing from environment!");
  }
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn("[Backend] WARNING: CLERK_SECRET_KEY is totally missing. Auth will fail.");
  }
  next();
});

app.use(ClerkExpressWithAuth());

// Database connection helper for serverless
let cachedDb: typeof mongoose | null = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI is missing from environment variables!");
    return null;
  }

  try {
    console.log("Creating new MongoDB connection...");
    cachedDb = await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log("MongoDB Connection Established");
    return cachedDb;
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    cachedDb = null;
    return null;
  }
};

// Middleware to ensure DB is connected for API routes
app.use("/api", async (req, res, next) => {
  // Skip health check to avoid recursion if it was there
  if (req.path === "/health") return next();

  try {
    const db = await connectDB();
    const state = mongoose.connection.readyState;
    if (!db || state !== 1) {
      console.error(`[DB Error] ${req.method} ${req.path} -> Connection invalid (State: ${state})`);
      return res.status(503).json({ 
        error: "Database connection unavailable", 
        details: "Mongoose could not establish a stable bridge to the neural cloud. Check MONGODB_URI.",
        readyState: state
      });
    }
    next();
  } catch (err: any) {
    console.error("[DB Crash]", err);
    res.status(500).json({ 
      error: "Database initialization error", 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
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
    dbState: mongoose.connection.readyState,
    clerkConfigured: !!process.env.CLERK_SECRET_KEY,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
    openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
    vercel: !!process.env.VERCEL,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/chat", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/files", fileRoutes);

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
        appType: "custom",
      });
      app.use(vite.middlewares);
      
      app.get("*", async (req, res, next) => {
        // Exclude API and known asset extensions to avoid accidental fallback
        if (req.path.startsWith("/api") || req.path.includes(".")) {
          return next();
        }

        const url = req.originalUrl;
        try {
          let template = await fs.readFile(path.resolve(__dirname, "index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e: any) {
          next(e);
        }
      });
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
