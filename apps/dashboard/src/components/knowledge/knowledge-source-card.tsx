"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";

interface KnowledgeSource {
  id: string;
  name: string;
  textContent: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface KnowledgeSourceCardProps {
  source: KnowledgeSource;
  chatbotId: string;
  onEdit: (source: KnowledgeSource) => void;
  onDelete: () => void;
}

export function KnowledgeSourceCard({
  source,
  chatbotId,
  onEdit,
  onDelete,
}: KnowledgeSourceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this knowledge entry?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/chatbots/${chatbotId}/knowledge/${source.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete knowledge entry");
      }

      onDelete();
    } catch (error) {
      console.error("Error deleting knowledge source:", error);
      alert("Failed to delete knowledge entry. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Truncate content for preview
  const previewContent =
    source.textContent.length > 200
      ? source.textContent.substring(0, 200) + "..."
      : source.textContent;

  // Format date
  const updatedDate = new Date(source.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-medium">{source.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(source)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {previewContent}
        </p>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{source.textContent.length.toLocaleString()} characters</span>
          <span>Updated {updatedDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
