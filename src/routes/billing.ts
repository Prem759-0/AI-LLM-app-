import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Stripe from "stripe";
import { User } from "../models/User.ts";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia" as any,
});

router.post("/create-checkout-session", ClerkExpressRequireAuth(), async (req: any, res) => {
  const { userId } = req.auth;
  const { plan } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const plans = {
    synapse: { name: "Synapse", price: 2400 },
    nexus: { name: "Nexus", price: 9900 }
  };

  const selectedPlan = plans[plan as keyof typeof plans] || plans.synapse;

  try {
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
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
              name: `Cortex ${selectedPlan.name} Plan`,
              description: `Full access to ${selectedPlan.name} features and neural models.`,
            },
            unit_amount: selectedPlan.price,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.origin}/billing?success=true`,
      cancel_url: `${req.headers.origin}/billing?canceled=true`,
      customer_email: user.email === "syncing..." ? undefined : user.email,
      metadata: {
        clerkId: userId,
        plan: selectedPlan.name
      },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ error: err.message });
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
