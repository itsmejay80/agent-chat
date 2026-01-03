import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import "dotenv/config";

import { Runner, InMemorySessionService } from "@google/adk";
import { rootAgent } from "./agent";

const PORT = Number(process.env.PORT) || 3000;

// Initialize Fastify
const fastify = Fastify({
    logger: true,
});

// Register plugins
await fastify.register(cors, {
    origin: true, // Allow all origins for widget embedding
});

await fastify.register(fastifyStatic, {
    root: path.join(import.meta.dir, "widget"),
    prefix: "/widget/",
});

// Initialize ADK components
const sessionService = new InMemorySessionService();
const runner = new Runner({
    appName: "chat-widget",
    agent: rootAgent,
    sessionService: sessionService,
});

// Store for user sessions
const userSessions = new Map<string, { userId: string; sessionId: string }>();

// Types for request bodies
interface SessionResponse {
    success: boolean;
    sessionId?: string;
    message?: string;
    error?: string;
}

interface ChatRequest {
    sessionId: string;
    message: string;
}

interface ChatResponse {
    success: boolean;
    response?: string;
    error?: string;
}

// Create new session
fastify.post<{ Reply: SessionResponse }>("/api/session", async (request, reply) => {
    try {
        const userId = `user_${uuidv4()}`;
        const sessionId = `session_${uuidv4()}`;

        // Create session in ADK
        await sessionService.createSession({
            appName: "chat-widget",
            userId: userId,
            sessionId: sessionId,
        });

        userSessions.set(sessionId, { userId, sessionId });

        return {
            success: true,
            sessionId: sessionId,
            message: "Session created successfully",
        };
    } catch (error) {
        fastify.log.error(error, "Error creating session");
        reply.status(500);
        return {
            success: false,
            error: "Failed to create session",
        };
    }
});

// Chat endpoint
fastify.post<{ Body: ChatRequest; Reply: ChatResponse }>("/api/chat", async (request, reply) => {
    try {
        const { sessionId, message } = request.body;

        if (!sessionId || !message) {
            reply.status(400);
            return {
                success: false,
                error: "sessionId and message are required",
            };
        }

        const sessionData = userSessions.get(sessionId);
        if (!sessionData) {
            reply.status(404);
            return {
                success: false,
                error: "Session not found. Please create a new session.",
            };
        }

        // Create message content for ADK
        const newMessage = {
            role: "user" as const,
            parts: [{ text: message }],
        };

        // Run the agent and collect response
        let responseText = "";
        const events = runner.runAsync({
            userId: sessionData.userId,
            sessionId: sessionData.sessionId,
            newMessage: newMessage,
        });

        for await (const event of events) {
            // Extract text from agent responses
            if (event.content?.parts) {
                for (const part of event.content.parts) {
                    if ("text" in part && part.text) {
                        responseText += part.text;
                    }
                }
            }
        }

        return {
            success: true,
            response: responseText || "I couldn't generate a response.",
        };
    } catch (error) {
        fastify.log.error(error, "Error in chat");
        reply.status(500);
        return {
            success: false,
            error: "Failed to process message",
        };
    }
});

// Health check
fastify.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: "0.0.0.0" });
        console.log(`\n🚀 Chat Widget API Server running on http://localhost:${PORT}`);
        console.log(`📦 Widget available at http://localhost:${PORT}/widget/chat-widget.js`);
        console.log(`🧪 Demo page: Open demo.html in your browser\n`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
