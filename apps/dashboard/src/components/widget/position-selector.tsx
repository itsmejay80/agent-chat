"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface PositionSelectorProps {
  value: Position;
  onChange: (position: Position) => void;
}

const positions: { value: Position; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

export function PositionSelector({ value, onChange }: PositionSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Widget Position</Label>
      <div className="grid grid-cols-2 gap-2">
        {positions.map((position) => (
          <button
            key={position.value}
            type="button"
            onClick={() => onChange(position.value)}
            className={cn(
              "flex items-center justify-center rounded-md border-2 p-4 text-sm font-medium transition-colors",
              value === position.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted hover:border-muted-foreground/50"
            )}
          >
            {position.label}
          </button>
        ))}
      </div>
    </div>
  );
}
