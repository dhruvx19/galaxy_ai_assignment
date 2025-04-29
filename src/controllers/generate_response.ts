import { Request, Response } from "express";
import { Groq } from "groq-sdk";
import multer from 'multer';
import ChatHistory from '../models/chatHistory';
import { uploadImage } from '../services/cloudnaryServices';

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware to handle file uploads
export const uploadMiddleware = upload.single('image');

export const generateGroqResponsesController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let { 
      messages, 
      model = "llama3-70b-8192", 
      sessionId, 
      userId 
    } = req.body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Messages are required and must be an array" });
      return;
    }
    
    if (!userId) {
      userId = "default-test-user";
    }

    if (!sessionId) {
      sessionId = Date.now().toString(); // simple sessionId using timestamp
    }
    
    // Validate the model
    const validModels = [
      "llama3-70b-8192",
      "llama3-8b-8192",
      "mixtral-8x7b-32768",
      "gemma-7b-it"
    ];
    
    if (!validModels.includes(model)) {
      res.status(400).json({ 
        error: "Invalid model specified", 
        validModels: validModels 
      });
      return;
    }

    // Handle image upload if present
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImage(req.file.buffer);
      
      // Update the last user message to include the image URL
      if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
        messages[messages.length - 1].imageUrl = imageUrl;
      }
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Create parameters for the API call
    const apiParams = {
      model,
      messages,
      temperature: req.body.temperature || 1,
      max_tokens: req.body.max_tokens || 1024,
      top_p: req.body.top_p || 1,
      frequency_penalty: req.body.frequency_penalty || 0,
      presence_penalty: req.body.presence_penalty || 0,
      stream: true,
    };

    // Fix: Explicitly type the stream as AsyncIterable
    const stream = await groq.chat.completions.create(apiParams) as unknown as AsyncIterable<{
      choices: Array<{ 
        delta: { 
          content: string | null 
        } 
      }>
    }>;

    // Set the response headers
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // Initialize variable to collect the full response
    let fullAssistantResponse = '';

    // Process the stream chunks
    for await (const chunk of stream) {
      const data = chunk.choices[0].delta.content || "";
      fullAssistantResponse += data;
      const formattedData = `data: ${JSON.stringify({ data })}\n\n`;
      res.write(formattedData);
    }

    // Add the assistant's response to the messages array
    const assistantMessage = {
      role: 'assistant',
      content: fullAssistantResponse
    };
    messages.push(assistantMessage);

    // Save or update the chat history in MongoDB
    await ChatHistory.findOneAndUpdate(
      { userId, sessionId },
      { 
        userId, 
        sessionId, 
        messages, 
        modelName: model // Changed from 'model' to 'modelName'
      },
      { upsert: true, new: true }
    );

    // End the response
    res.end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while processing your request" });
    return;
  }
};

// Controller to get chat history for a user
export const getChatHistoryController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    // Get all chat sessions for the user
    const chatSessions = await ChatHistory.find(
      { userId },
      { sessionId: 1, createdAt: 1, updatedAt: 1 }
    ).sort({ updatedAt: -1 });

    res.json({ sessions: chatSessions });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while retrieving chat history" });
  }
};

// Controller to get a specific chat session
export const getChatSessionController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, sessionId } = req.params;
    
    if (!userId || !sessionId) {
      res.status(400).json({ error: "userId and sessionId are required" });
      return;
    }

    // Get the chat session
    const chatSession = await ChatHistory.findOne({ userId, sessionId });
    
    if (!chatSession) {
      res.status(404).json({ error: "Chat session not found" });
      return;
    }

    res.json(chatSession);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred while retrieving the chat session" });
  }
};