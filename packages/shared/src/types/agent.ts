import { z } from "zod";

// Agent/Chatbot configuration schema
export const AgentConfigSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  systemPrompt: z.string().max(10000),
  model: z.string().default("gemini-2.0-flash"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(8192).default(2048),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Schema for creating a new agent
export const CreateAgentSchema = AgentConfigSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

// Schema for updating an agent
export const UpdateAgentSchema = CreateAgentSchema.partial();

export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>;

// Agent with related data
export interface AgentWithRelations extends AgentConfig {
  knowledgeSourcesCount?: number;
  conversationsCount?: number;
  messagesCount?: number;
}
