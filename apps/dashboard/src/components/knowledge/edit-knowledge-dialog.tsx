"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface KnowledgeSource {
  id: string;
  name: string;
  textContent: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface EditKnowledgeDialogProps {
  chatbotId: string;
  source: KnowledgeSource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MAX_NAME_LENGTH = 255;
const MAX_CONTENT_LENGTH = 100000;

export function EditKnowledgeDialog({
  chatbotId,
  source,
  open,
  onOpenChange,
  onSuccess,
}: EditKnowledgeDialogProps) {
  const [name, setName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when source changes
  useEffect(() => {
    if (source) {
      setName(source.name);
      setTextContent(source.textContent);
    }
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) return;

    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!textContent.trim()) {
      setError("Content is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/knowledge/${source.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            textContent: textContent.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update knowledge entry");
      }

      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Knowledge Entry</DialogTitle>
            <DialogDescription>
              Update the knowledge information for your chatbot.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Return Policy, Business Hours, Product Info"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/{MAX_NAME_LENGTH} characters
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                placeholder="Enter the knowledge content here."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                maxLength={MAX_CONTENT_LENGTH}
                disabled={isSubmitting}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                {textContent.length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()} characters
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
