// models/chatHistory.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for a single message
interface IMessage {
  role: string;
  content: string;
  imageUrl?: string; // For messages that contain images
}

// Define a custom interface that extends Document properly
export interface IChatHistory extends mongoose.Document {
  userId: string;
  sessionId: string;
  messages: IMessage[];
  modelName: string; // Changed from 'model' to 'modelName' to avoid conflict with Document.model
  createdAt: Date;
  updatedAt: Date;
}

// Schema for chat history
const ChatHistorySchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    messages: [
      {
        role: { type: String, required: true, enum: ['system', 'user', 'assistant'] },
        content: { type: String, required: true },
        imageUrl: { type: String } // Cloudinary URL for images
      }
    ],
    modelName: { type: String, required: true }, // Changed from 'model' to 'modelName'
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Create an index for quicker queries
ChatHistorySchema.index({ userId: 1, sessionId: 1 });

// Create and export the model
const ChatHistory: Model<IChatHistory> = mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
export default ChatHistory;