import Fastify, { type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import "dotenv/config";

import { Runner, LlmAgent } from "@google/adk";
import { loadChatbotConfig, loadWidgetConfig, reloadChatbotConfig, isChatbotActive } from "./config/loader";
import { createAgentFromConfig, invalidateAgent } from "./agent-factory";
import { SupabaseSessionService } from "./services/supabase-session-service";
import { configCache } from "./config/cache";

const PORT = Number(process.env.PORT) || 3001;

// Initialize Fastify
const fastify = Fastify({
  logger: true,
});

// Register plugins
await fastify.register(cors, {
  origin: true, // Allow all origins for widget embedding
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
  keyGenerator: (request: FastifyRequest) => request.ip,
  errorResponseBuilder: () => ({
    success: false,
    error: "Too many requests",
  }),
});

await fastify.register(fastifyStatic, {
  root: path.join(import.meta.dir, "widget"),
  prefix: "/widget/",
});

// Initialize ADK session service with Supabase persistence
const sessionService = new SupabaseSessionService();

// Cache for runners (keyed by chatbotId)
const runnerCache = new Map<string, Runner>();

// Types for request bodies
interface CreateSessionRequest {
  chatbotId: string;
  visitorId?: string;
  visitorName?: string;
  visitorEmail?: string;
  pageUrl?: string;
  userAgent?: string;
}

interface SessionResponse {
  success: boolean;
  sessionId?: string;
  userId?: string;
  appName?: string;
  message?: string;
  error?: string;
}

interface ChatRequest {
  sessionId: string;
  userId: string;
  appName: string;
  message: string;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  error?: string;
}

interface EndSessionRequest {
  sessionId: string;
  userId: string;
  appName: string;
}

interface EndSessionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface WidgetConfigResponse {
  success: boolean;
  config?: {
    title: string;
    subtitle: string | null;
    welcomeMessage: string;
    placeholder: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
    position: string;
    autoOpen: boolean;
    autoOpenDelay: number;
    showBranding: boolean;
  };
  error?: string;
}

/**
 * Get or create a runner for a chatbot
 */
function getRunner(chatbotId: string, agent: LlmAgent): Runner {
  let runner = runnerCache.get(chatbotId);
  if (!runner) {
    runner = new Runner({
      appName: `chatbot_${chatbotId}`,
      agent: agent,
      sessionService: sessionService,
    });
    runnerCache.set(chatbotId, runner);
  }
  return runner;
}

// Create new session with chatbot
fastify.post<{ Body: CreateSessionRequest; Reply: SessionResponse }>("/api/session", async (request, reply) => {
  try {
    const { chatbotId, visitorId, visitorName, visitorEmail, pageUrl, userAgent } = request.body;

    if (!chatbotId) {
      reply.status(400);
      return {
        success: false,
        error: "chatbotId is required",
      };
    }

    // Load chatbot configuration
    const chatbot = await loadChatbotConfig(chatbotId);
    if (!chatbot) {
      reply.status(404);
      return {
        success: false,
        error: "Chatbot not found",
      };
    }

    if (!chatbot.is_active) {
      reply.status(403);
      return {
        success: false,
        error: "Chatbot is not active",
      };
    }

    const userId = visitorId || `visitor_${uuidv4()}`;
    const sessionId = `session_${uuidv4()}`;
    const appName = `chatbot_${chatbotId}`;

    // Create session in Supabase with metadata
    await sessionService.createSession({
      appName,
      userId,
      sessionId,
      state: {
        chatbotId, // Store chatbotId in session state for later retrieval
      },
      metadata: {
        chatbotId,
        visitorId,
        visitorName,
        visitorEmail,
        pageUrl,
        userAgent: userAgent || request.headers["user-agent"],
      },
    });

    return {
      success: true,
      sessionId,
      userId,
      appName,
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
    const { sessionId, userId, appName, message } = request.body;

    if (!sessionId || !userId || !appName || !message) {
      reply.status(400);
      return {
        success: false,
        error: "sessionId, userId, appName, and message are required",
      };
    }

    // Extract chatbotId from appName
    const chatbotId = appName.replace("chatbot_", "");

    // Get session from database
    const session = await sessionService.getSession({
      appName,
      userId,
      sessionId,
    });

    if (!session) {
      reply.status(404);
      return {
        success: false,
        error: "Session not found. Please create a new session.",
      };
    }

    // Check if chatbot is still active
    const isActive = await isChatbotActive(chatbotId);
    if (!isActive) {
      reply.status(403);
      return {
        success: false,
        error: "Chatbot is no longer active",
      };
    }

    // Load chatbot config and get/create runner
    const chatbot = await loadChatbotConfig(chatbotId);
    if (!chatbot) {
      reply.status(404);
      return {
        success: false,
        error: "Chatbot configuration not found",
      };
    }

    const agent = await createAgentFromConfig(chatbot);
    const runner = getRunner(chatbotId, agent);

    // Create message content for ADK
    const newMessage = {
      role: "user" as const,
      parts: [{ text: message }],
    };

    // Run the agent and collect response
    let responseText = "";
    const events = runner.runAsync({
      userId,
      sessionId,
      newMessage,
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

// End session endpoint
fastify.post<{ Body: EndSessionRequest; Reply: EndSessionResponse }>("/api/session/end", async (request, reply) => {
  try {
    const { sessionId, userId, appName } = request.body;

    if (!sessionId || !userId || !appName) {
      reply.status(400);
      return {
        success: false,
        error: "sessionId, userId, and appName are required",
      };
    }

    // Delete the session from database
    await sessionService.deleteSession({
      appName,
      userId,
      sessionId,
    });

    // Clean up runner cache if no more sessions for this chatbot
    const chatbotId = appName.replace("chatbot_", "");
    // Note: We keep the runner cached for performance, it will be reused for new sessions

    return {
      success: true,
      message: "Session ended successfully",
    };
  } catch (error) {
    fastify.log.error(error, "Error ending session");
    // Don't fail if session doesn't exist - it may have already been deleted
    return {
      success: true,
      message: "Session ended",
    };
  }
});

// Get widget configuration for a chatbot
fastify.get<{ Params: { chatbotId: string }; Reply: WidgetConfigResponse }>(
  "/api/widget/:chatbotId/config",
  async (request, reply) => {
    try {
      const { chatbotId } = request.params;

      // Load chatbot to verify it exists and is active
      const chatbot = await loadChatbotConfig(chatbotId);
      if (!chatbot) {
        reply.status(404);
        return {
          success: false,
          error: "Chatbot not found",
        };
      }

      if (!chatbot.is_active) {
        reply.status(403);
        return {
          success: false,
          error: "Chatbot is not active",
        };
      }

      // Load widget configuration
      const widgetConfig = await loadWidgetConfig(chatbotId);

      // Return default config if none exists
      const config = widgetConfig
        ? {
            title: widgetConfig.title,
            subtitle: widgetConfig.subtitle,
            welcomeMessage: widgetConfig.welcome_message,
            placeholder: widgetConfig.placeholder,
            primaryColor: widgetConfig.primary_color,
            backgroundColor: widgetConfig.background_color,
            textColor: widgetConfig.text_color,
            borderRadius: widgetConfig.border_radius,
            position: widgetConfig.position,
            autoOpen: widgetConfig.auto_open,
            autoOpenDelay: widgetConfig.auto_open_delay,
            showBranding: widgetConfig.show_branding,
          }
        : {
            title: chatbot.name,
            subtitle: null,
            welcomeMessage: "Hi! How can I help you today?",
            placeholder: "Type your message...",
            primaryColor: "#6366f1",
            backgroundColor: "#ffffff",
            textColor: "#1f2937",
            borderRadius: 12,
            position: "bottom-right",
            autoOpen: false,
            autoOpenDelay: 3,
            showBranding: true,
          };

      return {
        success: true,
        config,
      };
    } catch (error) {
      fastify.log.error(error, "Error fetching widget config");
      reply.status(500);
      return {
        success: false,
        error: "Failed to fetch widget configuration",
      };
    }
  }
);

// Internal endpoint to reload chatbot configuration
fastify.post<{ Params: { chatbotId: string } }>(
  "/api/internal/reload/:chatbotId",
  async (request, reply) => {
    try {
      const { chatbotId } = request.params;
      const internalToken = process.env.INTERNAL_API_TOKEN;
      const providedToken = request.headers["x-internal-token"];

      if (!internalToken) {
        reply.status(500);
        return {
          success: false,
          error: "Internal token not configured",
        };
      }

      if (typeof providedToken !== "string" || providedToken !== internalToken) {
        reply.status(401);
        return {
          success: false,
          error: "Unauthorized",
        };
      }

      // Invalidate cached agent, runner, config, and knowledge
      invalidateAgent(chatbotId);
      runnerCache.delete(chatbotId);
      configCache.invalidateAll(chatbotId); // This now also invalidates knowledge cache
      await reloadChatbotConfig(chatbotId);

      return {
        success: true,
        message: `Configuration reloaded for chatbot ${chatbotId}`,
      };
    } catch (error) {
      fastify.log.error(error, "Error reloading config");
      reply.status(500);
      return {
        success: false,
        error: "Failed to reload configuration",
      };
    }
  }
);

// Health check
fastify.get("/api/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`\n🚀 Agent Server running on http://localhost:${PORT}`);
    console.log(`📦 Widget available at http://localhost:${PORT}/widget/chat-widget.js`);
    console.log(`🔗 Widget config endpoint: http://localhost:${PORT}/api/widget/:chatbotId/config`);
    console.log(`💾 Using SupabaseSessionService for persistent sessions`);
    console.log(`🧪 Demo page: Open demo.html in your browser\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
