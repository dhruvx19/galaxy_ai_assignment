"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatSessionController = exports.getChatHistoryController = exports.generateGroqResponsesController = exports.uploadMiddleware = void 0;
const groq_sdk_1 = require("groq-sdk");
const multer_1 = __importDefault(require("multer"));
const chatHistory_1 = __importDefault(require("../models/chatHistory"));
const cloudnaryServices_1 = require("../services/cloudnaryServices");
// Set up multer for memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
// Middleware to handle file uploads
exports.uploadMiddleware = upload.single('image');
const generateGroqResponsesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    try {
        let { messages, model = "llama3-70b-8192", sessionId, userId } = req.body;
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
            imageUrl = yield (0, cloudnaryServices_1.uploadImage)(req.file.buffer);
            // Update the last user message to include the image URL
            if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
                messages[messages.length - 1].imageUrl = imageUrl;
            }
        }
        // Initialize Groq client
        const groq = new groq_sdk_1.Groq({
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
        const stream = yield groq.chat.completions.create(apiParams);
        // Set the response headers
        res.set({
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        });
        // Initialize variable to collect the full response
        let fullAssistantResponse = '';
        try {
            // Process the stream chunks
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = yield stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const chunk = _c;
                const data = chunk.choices[0].delta.content || "";
                fullAssistantResponse += data;
                const formattedData = `data: ${JSON.stringify({ data })}\n\n`;
                res.write(formattedData);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) yield _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // Add the assistant's response to the messages array
        const assistantMessage = {
            role: 'assistant',
            content: fullAssistantResponse
        };
        messages.push(assistantMessage);
        // Save or update the chat history in MongoDB
        yield chatHistory_1.default.findOneAndUpdate({ userId, sessionId }, {
            userId,
            sessionId,
            messages,
            modelName: model // Changed from 'model' to 'modelName'
        }, { upsert: true, new: true });
        // End the response
        res.end();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while processing your request" });
        return;
    }
});
exports.generateGroqResponsesController = generateGroqResponsesController;
// Controller to get chat history for a user
const getChatHistoryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: "userId is required" });
            return;
        }
        // Get all chat sessions for the user
        const chatSessions = yield chatHistory_1.default.find({ userId }, { sessionId: 1, createdAt: 1, updatedAt: 1 }).sort({ updatedAt: -1 });
        res.json({ sessions: chatSessions });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while retrieving chat history" });
    }
});
exports.getChatHistoryController = getChatHistoryController;
// Controller to get a specific chat session
const getChatSessionController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, sessionId } = req.params;
        if (!userId || !sessionId) {
            res.status(400).json({ error: "userId and sessionId are required" });
            return;
        }
        // Get the chat session
        const chatSession = yield chatHistory_1.default.findOne({ userId, sessionId });
        if (!chatSession) {
            res.status(404).json({ error: "Chat session not found" });
            return;
        }
        res.json(chatSession);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while retrieving the chat session" });
    }
});
exports.getChatSessionController = getChatSessionController;
