import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  isPro: { type: Boolean, default: false },
  stripeCustomerId: { type: String },
  subscriptionId: { type: String },
  usage: {
    messages: { type: Number, default: 0 },
    images: { type: Number, default: 0 },
    files: { type: Number, default: 0 },
    lastReset: { type: Date, default: Date.now }
  }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
