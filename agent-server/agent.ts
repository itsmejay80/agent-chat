import { LlmAgent, FunctionTool } from "@google/adk";
import { z } from "zod";

async function greetUser({ name }: { name: string }): Promise<Record<string, unknown>> {
    return {
        message: `Hello, ${name}! Welcome to the Google ADK agent. How can I assist you today?`,
    };
}

const greetUserSchema = z.object({
    name: z.string().describe("The name of the person to greet"),
});

const greetingTool = new FunctionTool({
    name: "greet_user",
    description: "Greets the user with a personalized message",
    parameters: greetUserSchema,
    execute: greetUser,
});

export const rootAgent = new LlmAgent({
    name: "simple_agent",
    model: 'gemini-2.5-flash',
    description: "A simple helpful assistant that can greet users",
    instruction: `You are a friendly and helpful AI assistant built with Google ADK.
You can greet users by name using the greet_user tool.

Always be polite and helpful. When someone introduces themselves, use the greet_user tool to welcome them.`,
    tools: [greetingTool],
});
