import { LlmAgent } from "@google/adk";
import type { Chatbot } from "@agent-chat/shared";
import { loadKnowledgeForChatbot, formatKnowledgeForPrompt } from "./config/loader";
import type { KnowledgeEntry } from "./config/cache";

// Map of model aliases to actual model names
const MODEL_MAP: Record<string, string> = {
  "gemini-2.0-flash": "gemini-2.0-flash-exp",
  "gemini-1.5-flash": "gemini-1.5-flash",
  "gemini-1.5-pro": "gemini-1.5-pro",
};

/**
 * Base instructions that apply to ALL agents regardless of custom system prompts.
 * These ensure consistent, safe, and helpful behavior across all chatbots.
 */
const BASE_INSTRUCTIONS = `## Core Behavioral Guidelines (Always Active)

### Accuracy & Honesty
- ONLY respond with information from your provided knowledge base and system instructions
- NEVER fabricate, guess, or make up information including: facts, statistics, URLs, contact details, prices, dates, or any specific data
- If you don't have information about something, honestly say: "I don't have that information available" and offer to help with something else
- When uncertain about any details, acknowledge the uncertainty rather than providing potentially incorrect information

### Friendly & Helpful Demeanor
- Be warm, welcoming, and genuinely helpful in every interaction
- Use a conversational and approachable tone while remaining professional
- Show patience and understanding, especially with confused or frustrated users
- Make users feel valued and supported throughout the conversation

### Staying On Topic
- Focus on topics within your configured scope and knowledge base
- Politely redirect off-topic conversations back to areas where you can genuinely help
- If asked about topics outside your knowledge, kindly explain your limitations

---

`;

// Cache for created agents
const agentCache = new Map<string, { agent: LlmAgent; configHash: string }>();

/**
 * Generate a hash of the chatbot config for cache invalidation
 * Includes knowledge content to ensure agent updates when knowledge changes
 */
function getConfigHash(chatbot: Chatbot, knowledge: KnowledgeEntry[]): string {
  return JSON.stringify({
    id: chatbot.id,
    system_prompt: chatbot.system_prompt,
    model: chatbot.model,
    temperature: chatbot.temperature,
    max_tokens: chatbot.max_tokens,
    updated_at: chatbot.updated_at,
    // Include knowledge in hash to detect changes
    knowledge: knowledge.map((k) => ({ id: k.id, name: k.name, content: k.textContent })),
  });
}

/**
 * Create a dynamic agent based on chatbot configuration
 * Now async to support loading knowledge from database
 */
export async function createAgentFromConfig(chatbot: Chatbot): Promise<LlmAgent> {
  // Load knowledge for this chatbot
  const knowledge = await loadKnowledgeForChatbot(chatbot.id);
  const configHash = getConfigHash(chatbot, knowledge);

  // Check if we have a cached agent with the same config
  const cached = agentCache.get(chatbot.id);
  if (cached && cached.configHash === configHash) {
    return cached.agent;
  }

  // Get the actual model name
  const modelName = MODEL_MAP[chatbot.model] || chatbot.model;

  // ADK requires agent names to be valid identifiers (letters/digits/underscore).
  // Our chatbot IDs are UUIDs, so normalize to keep names stable and valid.
  const safeChatbotId = chatbot.id.replace(/[^a-zA-Z0-9_]/g, "_");

  // Build instruction with base instructions + custom prompt + knowledge
  const knowledgePrompt = formatKnowledgeForPrompt(knowledge);
  const fullInstruction = BASE_INSTRUCTIONS + chatbot.system_prompt + knowledgePrompt;

  // Create the agent with the chatbot's configuration
  const agent = new LlmAgent({
    name: `chatbot_${safeChatbotId}`,
    model: modelName,
    description: chatbot.description || `AI Assistant - ${chatbot.name}`,
    instruction: fullInstruction,
    tools: [],
  });

  // Cache the agent
  agentCache.set(chatbot.id, { agent, configHash });

  return agent;
}

/**
 * Invalidate cached agent for a chatbot
 */
export function invalidateAgent(chatbotId: string): void {
  agentCache.delete(chatbotId);
}

/**
 * Get agent for a chatbot, creating it if necessary
 * Now async to support loading knowledge from database
 */
export async function getAgentForChatbot(chatbot: Chatbot): Promise<LlmAgent> {
  return createAgentFromConfig(chatbot);
}
