"use client";

import Link from "next/link";
import { Bot, MessageSquare, Settings, MoreVertical, Power, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Chatbot } from "@agent-chat/shared";

interface ChatbotCardProps {
  chatbot: Chatbot;
  sessionsCount?: number;
  isMutating?: boolean;
  onToggleActive?: () => void;
  onDelete?: () => void;
}

export function ChatbotCard({
  chatbot,
  sessionsCount = 0,
  isMutating = false,
  onToggleActive,
  onDelete,
}: ChatbotCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{chatbot.name}</CardTitle>
              <CardDescription className="line-clamp-1">
                {chatbot.description || "No description"}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isMutating}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/chatbots/${chatbot.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!onToggleActive || isMutating}
                onClick={() => onToggleActive?.()}
              >
                <Power className="mr-2 h-4 w-4" />
                {chatbot.is_active ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!onDelete || isMutating}
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.()}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{sessionsCount} sessions</span>
            </div>
            <div
              className={`rounded-full px-2 py-0.5 text-xs ${
                chatbot.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {chatbot.is_active ? "Active" : "Inactive"}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/chatbots/${chatbot.id}`}>
              <Button variant="outline" size="sm" disabled={isMutating}>
                View
              </Button>
            </Link>
            <Link href={`/chatbots/${chatbot.id}/settings`}>
              <Button variant="outline" size="sm" disabled={isMutating}>
                Edit
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Model: {chatbot.model}
        </div>
      </CardContent>
    </Card>
  );
}
