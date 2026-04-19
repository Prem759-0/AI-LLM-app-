import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Stripe from "stripe";
import { User } from "../models/User.ts";

const router = express.Router();

// Helper to get Stripe client lazily and safely
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error("[Stripe] CRITICAL: STRIPE_SECRET_KEY is missing from environment.");
    return null;
  }
  try {
    return new Stripe(key, {
      apiVersion: "2024-11-20.acacia" as any,
    });
  } catch (err) {
    console.error("[Stripe] Initialization Failed:", err);
    return null;
  }
};

router.post("/create-checkout-session", ClerkExpressRequireAuth(), async (req: any, res) => {
  const { userId } = req.auth;
  const { plan = "synapse" } = req.body;

  console.log(`[Billing] Initiate checkout for user ${userId}, plan requested: ${plan}`);

  const stripe = getStripe();
  if (!stripe) {
    console.error("[Billing] Stripe NOT initialized - KEY MISSING");
    return res.status(500).json({ 
      error: "Payment configuration error", 
      details: "The server is not configured for payments. Please provide STRIPE_SECRET_KEY in environment variables." 
    });
  }

  const plans = {
    synapse: { id: "synapse", name: "Synapse", price: 2400 },
    nexus: { id: "nexus", name: "Nexus", price: 9900 },
    pro: { id: "synapse", name: "Synapse", price: 2400 } // fallback
  };

  const selectedPlan = plans[plan as keyof typeof plans] || plans.synapse;

  try {
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.log(`[Billing] User ${userId} record not found, bootstrapping entry...`);
      user = new User({ clerkId: userId, email: "syncing..." });
      await user.save();
    }

    console.log(`[Billing] Constructing Stripe session for ${userId} (${user.email})`);
    const origin = req.headers.origin || process.env.VITE_APP_URL || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Cortex ${selectedPlan.name} Tier`,
              description: `Full high-bandwidth access to ${selectedPlan.name} neural models.`,
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/chat?success=true`,
      cancel_url: `${origin}/billing?canceled=true`,
      customer_email: (user.email && user.email !== "syncing...") ? user.email : undefined,
      metadata: {
        clerkId: userId,
        plan: selectedPlan.id
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log(`[Billing] Subscription session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[Billing] Stripe Session Failure:", err.message);
    res.status(500).json({ 
      error: "Synthesis payment gateway failure", 
      details: err.message,
      type: err.type 
    });
  }
});

router.get("/status", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({ error: "Auth required" });
    }

    let user = await User.findOne({ clerkId: userId });
    
    // If user not in DB yet, return basic free tier
    if (!user) {
      console.log(`[Billing] User ${userId} not in DB, providing default bandwidth tier.`);
      return res.json({ 
        isPro: false, 
        usage: { messages: 0, images: 0, files: 0, lastReset: new Date() } 
      });
    }

    if (!user.usage) {
      console.warn(`[Billing] User ${userId} record malformed: missing usage block. Self-healing...`);
      user.usage = { messages: 0, images: 0, files: 0, lastReset: new Date() };
      await user.save();
    }

    // Daily Usage Reset Protocol
    const now = new Date();
    const lastReset = new Date(user.usage.lastReset || 0);
    const isNewDay = 
      now.getUTCDate() !== lastReset.getUTCDate() || 
      now.getUTCMonth() !== lastReset.getUTCMonth() || 
      now.getUTCFullYear() !== lastReset.getUTCFullYear();

    if (isNewDay) {
      console.log(`[Neural Reset] Replenishing bandwidth for ${userId}`);
      user.usage.messages = 0;
      user.usage.images = 0;
      user.usage.lastReset = now;
      await user.save();
    }

    res.json({ isPro: user.isPro || false, usage: user.usage });
  } catch (err: any) {
    console.error("[Cortex Billing] Status Error:", err.message);
    res.status(500).json({ 
      error: "Unable to retrieve neural bandwidth status", 
      details: err.message 
    });
  }
});

export default router;
