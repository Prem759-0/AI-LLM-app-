import express from "express";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import Stripe from "stripe";
import { User } from "../models/User.ts";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-03-25.dahlia" as any,
});

router.post("/create-checkout-session", ClerkExpressRequireAuth(), async (req: any, res) => {
  const { userId } = req.auth;
  const { plan } = req.body;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  try {
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      // In a real app, you might want to fetch email from Clerk if not in DB
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
              name: "Cortex Pro Plan",
              description: "Unlimited AI messages and priority access",
            },
            unit_amount: 2400, // $24.00
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
