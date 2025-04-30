import { Router } from 'express';
import multer from 'multer';
import { 
  generateGroqResponsesController, 
  getChatHistoryController,
  getChatSessionController 
} from '../controllers/generate_response';
import { uploadImageController } from '../controllers/upload_image';

// Create a router
const router = Router();

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Image upload route
router.post('/upload', upload.single('image'), uploadImageController);

// Chat routes
router.post('/generate_response', upload.single('image'), generateGroqResponsesController);
router.get('/history/:userId', getChatHistoryController);
router.get('/history/:userId/:sessionId', getChatSessionController);

export default router;