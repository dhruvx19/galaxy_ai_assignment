import { Router } from "express";
import helloRouter from "./hello_router";
import groqRouter from "./groq_router";

const router = Router();

router.use("/hello", helloRouter);
router.use("/generate_response", groqRouter);

export default router;