import { Router } from "express";
import { 
  generateGroqResponsesController, 
  getChatHistoryController,
  getChatSessionController,
  uploadMiddleware
} from "../controllers/generate_response";


const groqRouter = Router();


// Groq routes
groqRouter.post("/", uploadMiddleware, generateGroqResponsesController);
groqRouter.get("/history/:userId", getChatHistoryController);
groqRouter.get("/history/:userId/:sessionId", getChatSessionController);


// For backward compatibility, export the groqRouter as default
export default groqRouter;