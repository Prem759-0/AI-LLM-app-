import mongoose from "mongoose";

export interface IFile extends mongoose.Document {
  userId: string;
  name: string;
  size: string;
  type: string;
  content?: string;
  url?: string;
  isShared?: boolean;
  shareId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileSchema = new mongoose.Schema<IFile>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'image/png', 'text/plain', 'application/pdf'
  content: { type: String }, // Store small text content/data urls directly for preview
  url: { type: String }, // Placeholder for external storage if needed later
  isShared: { type: Boolean, default: false },
  shareId: { type: String, unique: true, sparse: true }
}, { timestamps: true });

export const File = mongoose.models.File || mongoose.model<IFile>("File", FileSchema);
