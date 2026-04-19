import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'image/png', 'text/plain', 'application/pdf'
  content: { type: String }, // Store small text content/data urls directly for preview
  url: { type: String }, // Placeholder for external storage if needed later
}, { timestamps: true });

export const File = mongoose.models.File || mongoose.model("File", FileSchema);
