import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { formatSessionId } from "@/lib/utils";
import {
  MessageSquare,
  Activity,
  Clock,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  Settings,
  Palette,
  Database,
  MessageCircle,
  ChevronRight,
  Cpu,
  Thermometer,
  Hash,
  Power,
} from "lucide-react";
import { EmbedCode } from "@/components/widget/embed-code";
import Link from "next/link";
import type { Chatbot } from "@agent-chat/shared";

type Session = {
  id: string;
  visitor_name: string | null;
  created_at: string;
};

interface ChatbotOverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatbotOverviewPage({
  params,
}: ChatbotOverviewPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch chatbot
  const { data: chatbot } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .single();

  // Fetch stats
  const [sessionsResult, eventsResult] = await Promise.all([
    supabase
      .from("adk_sessions")
      .select("*", { count: "exact", head: true })
      .eq("chatbot_id", id),
    supabase
      .from("adk_events")
      .select("id, adk_sessions!inner(chatbot_id)", { count: "exact", head: true })
      .eq("adk_sessions.chatbot_id", id),
  ]);

  const sessionsCount = sessionsResult.error ? "—" : sessionsResult.count ?? 0;
  const eventsCount = eventsResult.error ? "—" : eventsResult.count ?? 0;

  // Fetch recent sessions
  const { data: recentSessionsData, error: recentSessionsError } = await supabase
    .from("adk_sessions")
    .select("id, visitor_name, created_at")
    .eq("chatbot_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentSessions = (recentSessionsData ?? []) as Session[];

  // The layout already handles notFound(), so chatbot is guaranteed to exist
  const typedChatbot = chatbot as unknown as Chatbot;


  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Sessions"
          value={sessionsCount}
          description="Total chat sessions"
          icon={MessageSquare}
        />
        <StatsCard
          title="Events"
          value={eventsCount}
          description="Events processed"
          icon={Activity}
        />
        <StatsCard
          title="Avg. Response"
          value="1.2s"
          description="Average response time"
          icon={Clock}
        />
        <StatsCard
          title="Satisfaction"
          value="94%"
          description="User satisfaction rate"
          icon={TrendingUp}
          trend={{ value: 2.1, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 relative">
            <Link href={`/chatbots/${id}/settings`} className="block">
              <Button 
                variant="outline" 
                className="w-full justify-between group hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <span className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Edit Settings</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </Link>
            <Link href={`/chatbots/${id}/widget`} className="block">
              <Button 
                variant="outline" 
                className="w-full justify-between group hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <span className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                    <Palette className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Customize Widget</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </Link>
            <Link href={`/chatbots/${id}/knowledge`} className="block">
              <Button 
                variant="outline" 
                className="w-full justify-between group hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <span className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
                    <Database className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Manage Knowledge Base</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </Link>
            <a
              href={`http://localhost:3001/widget/demo.html?chatbotId=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button 
                variant="outline" 
                className="w-full justify-between group hover:bg-primary/5 hover:border-primary/30 transition-all"
              >
                <span className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Test Chatbot</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Button>
            </a>
          </CardContent>
        </Card>

        <EmbedCode chatbotId={id} />
      </div>

      {/* Recent Sessions */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 -mr-16 -mt-16 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between relative">
          <CardTitle className="text-lg font-semibold">Recent Sessions</CardTitle>
          <Link href={`/chatbots/${id}/sessions`}>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
              View all
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="relative">
          {recentSessionsError ? (
            <div className="flex items-start gap-3 rounded-xl border p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Couldn’t load sessions</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recentSessionsError.message}
                </p>
              </div>
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-muted/30 to-transparent p-4 transition-all hover:border-primary/20 hover:shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">
                        Session #{formatSessionId(session.id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No sessions yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Share your chatbot to start receiving messages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Summary */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 -mr-16 -mt-16 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
        <CardHeader className="relative">
          <CardTitle className="text-lg font-semibold">Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-muted/30 to-transparent p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-semibold">{typedChatbot?.model}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-muted/30 to-transparent p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <Thermometer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="font-semibold">{typedChatbot?.temperature}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-muted/30 to-transparent p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Hash className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Tokens</p>
                <p className="font-semibold">{typedChatbot?.max_tokens}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border bg-gradient-to-r from-muted/30 to-transparent p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typedChatbot?.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                <Power className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`font-semibold ${typedChatbot?.is_active ? 'text-emerald-600' : 'text-gray-600'}`}>
                  {typedChatbot?.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
