import { Router } from "express";
import { body, matchedData, param, validationResult } from "express-validator";
import { catchAsync } from "../helper/catchAsync";
import { HttpError, HttpError400 } from "../errors/HttpError";
import { env } from "../env";
import { getUser, queryUser } from "../services/user-services/user.services";
import { requiresAuthentication } from "../middleware/requireAuth";
import { hasPermission } from "../middleware/requirePermission";
import {
  createApplication,
  deleteApplication,
  getAllApplications,
} from "../services/application.service";
import { logger } from "../logger";
import { createOllama } from "ollama-ai-provider";
import { streamText, Message } from "ai";

export const aiRouter = Router();

interface ChatRequest {
  messages: Message[];
  model: string;
}

aiRouter.post(
  "/command",
  requiresAuthentication,
  catchAsync(async (req, res) => {
    try {
      const { messages, model = "llama3.2:latest" } = req.body as ChatRequest;

      const ollama = createOllama({
        baseURL: process.env.OLLAMA_API_URL || "http://localhost:11434/api",
      });

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await streamText({
        model: ollama(model),
        messages,
        maxTokens: 2048,
        temperature: 0.7,
      });

      // Stream in the format that matches the direct Ollama call
      for await (const chunk of stream.textStream) {
        res.write(`0:${JSON.stringify(chunk)}\n`);
      }

      // Send completion message in the same format as the direct Ollama call
      res.write(`d:{"finishReason":"stop","usage":{"promptTokens":68,"completionTokens":5}}\n`);
      res.end();
    } catch (error) {
      logger.error("Ollama Chat Error:", error);
      res.status(500).json({
        error: "Failed to process AI chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }),
);
