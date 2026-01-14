import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSessionId(
  id: string | null | undefined,
  opts?: { prefix?: string; length?: number }
): string {
  if (!id) return "—";

  const prefix = opts?.prefix ?? "session_";
  const length = opts?.length ?? 8;

  const withoutPrefix = id.startsWith(prefix) ? id.slice(prefix.length) : id;
  return withoutPrefix.length > length
    ? withoutPrefix.slice(0, length)
    : withoutPrefix;
}
