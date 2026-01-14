"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

interface AddKnowledgeDialogProps {
  chatbotId: string;
  onSuccess: () => void;
}

const MAX_NAME_LENGTH = 255;
const MAX_CONTENT_LENGTH = 100000;

export function AddKnowledgeDialog({
  chatbotId,
  onSuccess,
}: AddKnowledgeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const response = await fetch(`/api/chatbots/${chatbotId}/knowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          textContent: textContent.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create knowledge entry");
      }

      // Reset form and close dialog
      setName("");
      setTextContent("");
      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setName("");
        setTextContent("");
        setError(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Knowledge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Knowledge Entry</DialogTitle>
            <DialogDescription>
              Add information that your chatbot can use to answer questions.
              This could be FAQs, product details, policies, or any other
              relevant content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
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
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter the knowledge content here. Be specific and detailed - this information will be used by your chatbot to answer user questions."
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
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
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
                  Adding...
                </>
              ) : (
                "Add Knowledge"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
