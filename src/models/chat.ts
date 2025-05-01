// models/chat.ts
import mongoose, { Document, Schema } from 'mongoose';

// Interface for a message
interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}


export interface IChat extends Document {
    sessionId: string;
    userId: string;
    title: string;
    messages: IMessage[];
    modelName: string; // renamed from 'model'
    createdAt: Date;
    updatedAt: Date;
  }
  

// Schema for a message
const MessageSchema = new Schema<IMessage>({
  role: { 
    type: String, 
    required: true, 
    enum: ['user', 'assistant'] 
  },
  content: { 
    type: String, 
    required: true 
  },
  imageUrl: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Schema for a chat session
const ChatSchema = new Schema<IChat>({
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, default: 'New Chat' },
    messages: [MessageSchema],
    modelName: { type: String, default: 'llama3-70b-8192' }, // renamed here too
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  

// Create index on sessionId and userId for faster lookups
ChatSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IChat>('Chat', ChatSchema);