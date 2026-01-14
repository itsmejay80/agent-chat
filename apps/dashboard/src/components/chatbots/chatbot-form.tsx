"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import type { Chatbot } from "@agent-chat/shared";

const AVAILABLE_MODELS = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
];

const DEFAULT_SYSTEM_PROMPT = `You are a friendly and helpful AI assistant. Your personality is warm, approachable, and genuinely eager to help.

## Communication Style
- Be conversational and personable - greet users warmly and use a friendly tone
- Show genuine interest in helping and make users feel welcome
- Use clear, simple language that's easy to understand
- Add a touch of personality while remaining professional
- Be patient and supportive, especially with confused or frustrated users

## Knowledge & Accuracy Guidelines
- ONLY provide information based on the knowledge base and instructions provided by the admin
- If you don't have specific information in your knowledge base, politely say so: "I don't have that information available, but I'd be happy to help with something else!"
- NEVER make up facts, statistics, URLs, phone numbers, or specific details
- When uncertain, acknowledge it honestly rather than guessing
- If a question is outside your configured scope, kindly redirect the conversation

## Response Guidelines
- Keep responses helpful and appropriately concise
- Ask clarifying questions when the user's intent is unclear
- Offer to help with related topics when appropriate
- End interactions on a positive, helpful note`;

interface ChatbotFormProps {
  chatbot?: Chatbot;
  mode: "create" | "edit";
}

export function ChatbotForm({ chatbot, mode }: ChatbotFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: chatbot?.name ?? "",
    description: chatbot?.description ?? "",
    system_prompt: chatbot?.system_prompt ?? DEFAULT_SYSTEM_PROMPT,
    model: chatbot?.model ?? "gemini-2.0-flash",
    temperature: chatbot?.temperature ?? 0.7,
    max_tokens: chatbot?.max_tokens ?? 2048,
    is_active: chatbot?.is_active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url =
        mode === "create" ? "/api/chatbots" : `/api/chatbots/${chatbot?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save chatbot");
      }

      const data = await response.json();
      router.push(`/chatbots/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="My Helpful Assistant"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="A brief description of your chatbot"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="system_prompt">
              Instructions for your chatbot
            </Label>
            <Textarea
              id="system_prompt"
              placeholder="You are a helpful assistant..."
              className="min-h-[200px] font-mono text-sm"
              value={formData.system_prompt}
              onChange={(e) =>
                setFormData({ ...formData, system_prompt: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Define your chatbot&apos;s personality, capabilities, and how it should
              respond to users.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select
              value={formData.model}
              onValueChange={(value) =>
                setFormData({ ...formData, model: value })
              }
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {formData.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[formData.temperature]}
              onValueChange={([value]) =>
                setFormData({ ...formData, temperature: value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Lower values make responses more focused and deterministic. Higher
              values make responses more creative and varied.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="max_tokens">Max Tokens</Label>
              <span className="text-sm text-muted-foreground">
                {formData.max_tokens}
              </span>
            </div>
            <Slider
              id="max_tokens"
              min={256}
              max={8192}
              step={256}
              value={[formData.max_tokens]}
              onValueChange={([value]) =>
                setFormData({ ...formData, max_tokens: value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens in the response.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active">Active</Label>
              <p className="text-sm text-muted-foreground">
                Allow this chatbot to receive messages
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Chatbot" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
