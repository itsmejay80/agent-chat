"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Settings, ChevronDown, Sun, Moon } from "lucide-react";
import type { User as UserType } from "@agent-chat/shared";

interface HeaderProps {
  user: UserType | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="flex h-14 items-center justify-end gap-2 px-6 bg-transparent">
      {/* Theme Toggle */}
      {mounted && (
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-[18px] w-[18px] transition-transform duration-300 rotate-0 scale-100" />
          ) : (
            <Moon className="h-[18px] w-[18px] transition-transform duration-300 rotate-0 scale-100" />
          )}
        </button>
      )}

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:bg-secondary"
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name || "User"}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-background"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-medium text-primary-foreground">
              {initials}
            </div>
          )}
          <span className="hidden text-sm font-medium sm:inline-block">
            {user?.full_name?.split(" ")[0] || "User"}
          </span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right animate-scale-in rounded-xl border bg-card p-1.5 shadow-medium">
            <div className="px-3 py-2.5 mb-1">
              <p className="text-sm font-medium">{user?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="h-px bg-border mb-1" />
            <button
              onClick={() => router.push("/settings")}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
