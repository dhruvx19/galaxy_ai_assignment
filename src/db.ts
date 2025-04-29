// db.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("❌ MONGODB_URI not found in environment variables.");
  process.exit(1); // Exit the app if MONGODB_URI is missing
}

// Function to connect to MongoDB
export const connectDB = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
};
