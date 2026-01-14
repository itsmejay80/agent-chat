import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  delay?: number;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  delay = 0,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl bg-card p-5 transition-all duration-300 hover:shadow-soft animate-fade-in-up opacity-0",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Subtle accent line */}
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-semibold tracking-tight tabular-nums">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
