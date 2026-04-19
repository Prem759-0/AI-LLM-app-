import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
  clerkId: string;
  email: string;
  isPro: boolean;
  stripeCustomerId?: string;
  subscriptionId?: string;
  usage: {
    messages: number;
    images: number;
    files: number;
    lastReset: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
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

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
