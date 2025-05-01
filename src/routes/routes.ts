// routes/routes.ts
import { Router } from "express";
import { 
  generateGroqResponsesController, 
  getUserChatsController,
  getChatByIdController,
  uploadImageController,
  updateChatTitleController,
  deleteChatController,
  getLatestMessagesController,
  createNewChatController,
  uploadMiddleware 
} from "../controllers/chat_controller";

const router = Router();

// Chat creation and interaction endpoints
router.post("/chat/new", createNewChatController);
router.post("/generate_response", uploadMiddleware, generateGroqResponsesController);

// Chat retrieval endpoints
router.get("/chats/:userId", getUserChatsController);
router.get("/chat/:sessionId", getChatByIdController);
router.get("/latest-messages/:userId", getLatestMessagesController);

// Chat management endpoints
router.put("/chat/:sessionId/title", updateChatTitleController);
router.delete("/chat/:sessionId", deleteChatController);

// Image upload endpoint
router.post("/upload", uploadMiddleware, uploadImageController);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

export default router;