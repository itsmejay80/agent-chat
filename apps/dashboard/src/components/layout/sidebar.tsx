"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Bot, Sparkles } from "lucide-react";

const navigation = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Chatbots",
    href: "/chatbots",
    icon: Bot,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-60 flex-col bg-card/50 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Agent Chat
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4">
        <div className="space-y-1">
          {navigation.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                style={{ animationDelay: `${index * 50}ms` }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-fade-in opacity-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-[18px] w-[18px] transition-transform duration-200",
                  !isActive && "group-hover:scale-110"
                )} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Upgrade prompt */}
      <div className="p-3">
        <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-4 animate-fade-in opacity-0" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-soft" />
            <p className="text-xs font-medium text-muted-foreground">Free Plan</p>
          </div>
          <p className="text-xl font-display font-semibold tabular-nums">
            0<span className="text-muted-foreground text-sm font-normal"> / 1,000</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">
            messages this month
          </p>
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Upgrade plan
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
