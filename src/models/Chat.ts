import mongoose from "mongoose";

export interface IMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChat extends mongoose.Document {
  userId: string;
  title: string;
  order: number;
  messages: IMessage[];
  updatedAt: Date;
  createdAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema<IChat>({
  userId: { type: String, required: true },
  title: { type: String, default: "New Chat" },
  order: { type: Number, default: 0 },
  messages: [messageSchema],
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export const Chat = (mongoose.models.Chat as mongoose.Model<IChat>) || mongoose.model<IChat>("Chat", chatSchema);
