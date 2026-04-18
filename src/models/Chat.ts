import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, default: "New Chat" },
  order: { type: Number, default: 0 },
  messages: [messageSchema],
  updatedAt: { type: Date, default: Date.now },
});

interface IChat extends mongoose.Document {
  userId: string;
  title: string;
  order: number;
  messages: any[];
  updatedAt: Date;
}

export const Chat = (mongoose.models.Chat as mongoose.Model<IChat>) || mongoose.model<IChat>("Chat", chatSchema);
