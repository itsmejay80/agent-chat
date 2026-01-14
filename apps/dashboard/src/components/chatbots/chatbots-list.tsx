"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatbotCard } from "@/components/chatbots/chatbot-card";
import type { Chatbot } from "@agent-chat/shared";

type ChatbotWithSessions = Chatbot & {
  adk_sessions?: { count: number }[];
};

interface ChatbotsListProps {
  initialChatbots: ChatbotWithSessions[];
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function ChatbotsList({ initialChatbots }: ChatbotsListProps) {
  const router = useRouter();

  const [chatbots, setChatbots] = useState<ChatbotWithSessions[]>(initialChatbots);
  const [query, setQuery] = useState("");

  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chatbot | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filteredChatbots = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return chatbots;

    return chatbots.filter((chatbot) => {
      const name = chatbot.name?.toLowerCase() ?? "";
      const description = chatbot.description?.toLowerCase() ?? "";
      return name.includes(trimmed) || description.includes(trimmed);
    });
  }, [chatbots, query]);

  const handleToggleActive = async (chatbot: Chatbot) => {
    setActionError(null);
    setMutatingId(chatbot.id);
    try {
      const response = await fetch(`/api/chatbots/${chatbot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !chatbot.is_active }),
      });

      if (!response.ok) {
        const data = (await parseJsonSafely(response)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to update chatbot");
      }

      const updated = (await response.json()) as Chatbot;
      setChatbots((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update chatbot";
      setActionError(message);
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setActionError(null);
    setDeleteError(null);
    setMutatingId(deleteTarget.id);
    try {
      const response = await fetch(`/api/chatbots/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await parseJsonSafely(response)) as { error?: string } | null;
        throw new Error(data?.error || "Failed to delete chatbot");
      }

      setChatbots((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete chatbot";
      setDeleteError(message);
    } finally {
      setMutatingId(null);
    }
  };

  const hasChatbots = chatbots.length > 0;

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {hasChatbots ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search chatbots..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredChatbots.length} of {chatbots.length}
          </div>
        </div>
      ) : null}

      {filteredChatbots.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChatbots.map((chatbot) => (
            <ChatbotCard
              key={chatbot.id}
              chatbot={chatbot}
              sessionsCount={chatbot.adk_sessions?.[0]?.count ?? 0}
              isMutating={mutatingId === chatbot.id}
              onToggleActive={() => handleToggleActive(chatbot)}
              onDelete={() => setDeleteTarget(chatbot)}
            />
          ))}
        </div>
      ) : hasChatbots ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Bot className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No matches</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Try a different search term.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setQuery("")}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Bot className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No chatbots yet</h3>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Get started by creating your first AI chatbot.
          </p>
          <Link href="/chatbots/new" className="mt-6">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create your first chatbot
            </Button>
          </Link>
        </div>
      )}

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chatbot?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium">{deleteTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {deleteError ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={mutatingId === deleteTarget?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={mutatingId === deleteTarget?.id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
