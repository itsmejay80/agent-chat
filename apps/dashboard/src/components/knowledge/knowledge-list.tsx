"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { KnowledgeSourceCard } from "./knowledge-source-card";
import { EditKnowledgeDialog } from "./edit-knowledge-dialog";

interface KnowledgeSource {
  id: string;
  name: string;
  textContent: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeListProps {
  chatbotId: string;
  refreshTrigger?: number;
}

export function KnowledgeList({ chatbotId, refreshTrigger }: KnowledgeListProps) {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(
    null
  );

  const fetchSources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/chatbots/${chatbotId}/knowledge`);

      if (!response.ok) {
        throw new Error("Failed to fetch knowledge sources");
      }

      const data = await response.json();
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [chatbotId]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources, refreshTrigger]);

  const handleEdit = (source: KnowledgeSource) => {
    setEditingSource(source);
  };

  const handleEditClose = () => {
    setEditingSource(null);
  };

  const handleEditSuccess = () => {
    fetchSources();
  };

  const handleDelete = () => {
    fetchSources();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchSources}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No knowledge yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add knowledge entries to help your chatbot answer questions more
              accurately.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total characters
  const totalCharacters = sources.reduce(
    (sum, source) => sum + source.textContent.length,
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Knowledge Sources</CardTitle>
            <div className="text-sm text-muted-foreground">
              {sources.length} {sources.length === 1 ? "entry" : "entries"} |{" "}
              {totalCharacters.toLocaleString()} total characters
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {sources.map((source) => (
              <KnowledgeSourceCard
                key={source.id}
                source={source}
                chatbotId={chatbotId}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <EditKnowledgeDialog
        chatbotId={chatbotId}
        source={editingSource}
        open={!!editingSource}
        onOpenChange={(open) => !open && handleEditClose()}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
