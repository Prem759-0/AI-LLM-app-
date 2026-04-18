import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Stripe from "stripe";
import { User } from "../models/User.ts";

const router = express.Router();
let stripe: Stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-11-20.acacia" as any,
  });
} catch (err) {
  console.error("Critical: Stripe failed to initialize. Check your API keys.");
}

router.post("/create-checkout-session", ClerkExpressRequireAuth(), async (req: any, res) => {
  const { userId } = req.auth;
  const { plan = "synapse" } = req.body;

  console.log(`[Billing] Creating checkout session for user ${userId}, plan: ${plan}`);

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[Billing] STRIPE_SECRET_KEY is missing.");
    return res.status(500).json({ error: "Stripe configuration error. Please try again later." });
  }

  const plans = {
    synapse: { name: "Synapse", price: 2400 },
    nexus: { name: "Nexus", price: 9900 },
    pro: { name: "Synapse", price: 2400 } // fallback for legacy 'pro' calls
  };

  const selectedPlan = plans[plan as keyof typeof plans] || plans.synapse;

  try {
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      console.log(`[Billing] User ${userId} not found in DB, creating entry.`);
      user = new User({ clerkId: userId, email: "syncing..." });
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Cortex ${selectedPlan.name} Tier`,
              description: `Full access to ${selectedPlan.name} neural models and high-bandwidth synthesis.`,
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.origin}/chat?success=true`,
      cancel_url: `${req.headers.origin}/billing?canceled=true`,
      customer_email: user.email === "syncing..." ? undefined : user.email,
      metadata: {
        clerkId: userId,
        plan: selectedPlan.name
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    console.log(`[Billing] Session created: ${session.id}`);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error("[Stripe Checkout Error]", err);
    res.status(500).json({ 
      error: "Payment gateway error", 
      details: err.message,
      type: err.type 
    });
  }
});

router.get("/status", ClerkExpressRequireAuth(), async (req: any, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });
    res.json({ isPro: user?.isPro || false, usage: user?.usage });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
