import { Router } from "express";
import { 
  generateGroqResponsesController, 
  uploadMiddleware
} from "../controllers/generate_response";


const groqRouter = Router();


// Groq routes
groqRouter.post("/", uploadMiddleware, generateGroqResponsesController);


// For backward compatibility, export the groqRouter as default
export default groqRouter;