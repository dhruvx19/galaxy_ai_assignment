import express, { Express } from "express";
import http from 'http';
import cors from 'cors';
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import router from "./routes/routes";
import groqRouter from "./routes/groq_router";
import uploadRouter from "./routes/upload_router";
import { connectDB } from "./db"; 

// Load environment variables first
dotenv.config();

// Establish MongoDB connection before setting up the rest of the server
connectDB();

const app: Express = express();
const server = http.createServer(app);

// Configure CORS with more specific options
app.use(cors({
  origin: '*', // Allow all origins - in production you might want to restrict this
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // Cache preflight request results for 24 hours (in seconds)
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for larger payloads
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Port configuration - use the PORT env variable
const PORT = process.env.PORT || 3000;

// Routes
app.use("/api/v1", router);
// Uncomment if you need to use groqRouter
// app.use("/api/v1/groq", groqRouter);
app.use("/", uploadRouter); // Add upload router

// Health check endpoint - useful for Railway to verify your app is running
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start server
try {
  server.listen(PORT, (): void => {
    console.log(`Server is running on port ${PORT}`);
  });
} catch (error) {
  console.log("Server error:", error);
}

export default server;