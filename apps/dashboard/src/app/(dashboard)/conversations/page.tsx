import Link from "next/link";
import { AlertTriangle, ChevronRight, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatSessionId } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionWithChatbot = {
  id: string;
  chatbot_id: string | null;
  visitor_name: string | null;
  created_at: string;
  chatbot: { name: string }[] | null;
};

export default async function ConversationsPage() {
  const supabase = await createClient();

  const { data: sessions, error } = await supabase
    .from("adk_sessions")
    .select("id, chatbot_id, visitor_name, created_at, chatbot:chatbots(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const typedSessions = (sessions ?? []) as SessionWithChatbot[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground">
          Browse recent chat sessions across your chatbots.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent conversations</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Couldn’t load conversations</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error.message}
                </p>
              </div>
            </div>
          ) : typedSessions.length > 0 ? (
            <div className="space-y-3">
              {typedSessions.map((session) => {
                const chatbotName = session.chatbot?.[0]?.name ?? "Unknown";

                const row = (
                  <div className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-muted/30 to-transparent p-4 transition-all hover:border-primary/20 hover:shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MessageSquare className="h-5 w-5" />
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
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{chatbotName}</Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );

                return session.chatbot_id ? (
                  <Link
                    key={session.id}
                    href={`/chatbots/${session.chatbot_id}`}
                    className="block"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={session.id}>{row}</div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg mb-1">No conversations yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Once visitors start chatting, sessions will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
