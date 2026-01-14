import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { formatSessionId } from "@/lib/utils";
import {
  Bot,
  MessageSquare,
  Activity,
  Plus,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Chatbot, User, Tenant } from "@agent-chat/shared";

type SessionWithChatbot = {
  id: string;
  chatbot_id: string | null;
  visitor_name: string | null;
  created_at: string;
  chatbot: { name: string }[] | null;
};

type UserWithTenant = User & {
  tenant: Tenant | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user and tenant info
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("*, tenant:tenants(*)")
    .eq("id", authUser?.id ?? "")
    .single();

  const user = userData as UserWithTenant | null;
  const tenantId = user?.tenant_id ?? "";

  // Fetch stats
  const [chatbotsResult, sessionsResult, eventsResult] =
    await Promise.all([
      supabase
        .from("chatbots")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId),
      supabase.from("adk_sessions").select("*", { count: "exact", head: true }),
      supabase.from("adk_events").select("*", { count: "exact", head: true }),
    ]);

  const chatbotsCount = chatbotsResult.error ? "—" : chatbotsResult.count ?? 0;
  const sessionsCount = sessionsResult.error ? "—" : sessionsResult.count ?? 0;
  const eventsCount = eventsResult.error ? "—" : eventsResult.count ?? 0;

  // Fetch recent chatbots
  const { data: recentChatbots } = await supabase
    .from("chatbots")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch recent sessions
  const { data: recentSessions, error: recentSessionsError } = await supabase
    .from("adk_sessions")
    .select("id, chatbot_id, visitor_name, created_at, chatbot:chatbots(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const chatbots = (recentChatbots ?? []) as Chatbot[];
  const sessions = (recentSessions ?? []) as SessionWithChatbot[];

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const greeting = getGreeting();

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-8">
      {/* Welcome Section */}
      <div className="animate-fade-in opacity-0">
        <p className="text-sm font-medium text-muted-foreground">{greeting}</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight mt-1">
          Welcome back, {firstName}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Chatbots"
          value={chatbotsCount}
          description="Active AI assistants"
          icon={Bot}
          delay={100}
        />
        <StatsCard
          title="Sessions"
          value={sessionsCount}
          description="Total conversations"
          icon={MessageSquare}
          delay={150}
        />
        <StatsCard
          title="Events"
          value={eventsCount}
          description="Messages processed"
          icon={Activity}
          delay={200}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chatbots Section - Takes more space */}
        <div className="lg:col-span-3 space-y-4 animate-fade-in-up opacity-0" style={{ animationDelay: "250ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Your Chatbots</h2>
            <Link href="/chatbots">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {chatbots.length > 0 ? (
            <div className="space-y-3">
              {chatbots.map((chatbot, index) => (
                <Link
                  key={chatbot.id}
                  href={`/chatbots/${chatbot.id}`}
                  className="group flex items-center justify-between rounded-2xl bg-card p-4 transition-all duration-200 hover:shadow-soft"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        {chatbot.name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {chatbot.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        chatbot.is_active
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${chatbot.is_active ? "bg-success" : "bg-muted-foreground"}`} />
                      {chatbot.is_active ? "Active" : "Inactive"}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mb-4">
                <Sparkles className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">Create your first chatbot</h3>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                Build an AI-powered assistant to help your visitors
              </p>
              <Link href="/chatbots/new" className="mt-5">
                <Button className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Create Chatbot
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in-up opacity-0" style={{ animationDelay: "300ms" }}>
          <h2 className="font-display text-lg font-semibold">Recent Sessions</h2>

          {recentSessionsError ? (
            <div className="flex items-start gap-3 rounded-2xl bg-card p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Couldn’t load sessions</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recentSessionsError.message}
                </p>
              </div>
            </div>
          ) : sessions.length > 0 ? (
            <div className="rounded-2xl bg-card overflow-hidden">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-4 transition-colors hover:bg-secondary/50 ${
                    index !== sessions.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      Session #{formatSessionId(session.id)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.chatbot?.[0]?.name ?? "Unknown chatbot"}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatRelativeTime(session.created_at)}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-card py-10 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No sessions yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sessions appear when visitors start chatting
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in-up opacity-0" style={{ animationDelay: "350ms" }}>
        <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/chatbots/new" className="group">
            <div className="flex items-center gap-4 rounded-2xl bg-card p-4 transition-all duration-200 hover:shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium group-hover:text-primary transition-colors">Create Chatbot</p>
                <p className="text-sm text-muted-foreground">Build a new AI assistant</p>
              </div>
            </div>
          </Link>
          <Link href="/chatbots" className="group">
            <div className="flex items-center gap-4 rounded-2xl bg-card p-4 transition-all duration-200 hover:shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium group-hover:text-primary transition-colors">Manage Chatbots</p>
                <p className="text-sm text-muted-foreground">Configure your assistants</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
