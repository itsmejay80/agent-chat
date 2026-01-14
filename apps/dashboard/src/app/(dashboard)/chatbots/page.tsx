import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ChatbotsList } from "@/components/chatbots/chatbots-list";
import type { Chatbot } from "@agent-chat/shared";

type ChatbotWithSessions = Chatbot & {
  adk_sessions: { count: number }[];
};

export default async function ChatbotsPage() {
  const supabase = await createClient();

  // Get the current user's tenant
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const { data: userData } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", authUser?.id ?? "")
    .single();

  const tenantId = (userData as { tenant_id: string } | null)?.tenant_id ?? "";

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chatbots</h1>
            <p className="text-muted-foreground">
              Create and manage your AI chatbots
            </p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Chatbot
          </Button>
        </div>

        <div className="flex items-start gap-3 rounded-lg border p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">No tenant found</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Your user account isn’t linked to a tenant yet, so chatbots can’t be listed or created.
              Check your onboarding/setup flow and ensure there’s a row in the <code>users</code> table with a <code>tenant_id</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch chatbots with session counts
  const { data: chatbots } = await supabase
    .from("chatbots")
    .select("*, adk_sessions(count)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const chatbotsWithSessions = (chatbots ?? []) as ChatbotWithSessions[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chatbots</h1>
          <p className="text-muted-foreground">
            Create and manage your AI chatbots
          </p>
        </div>
        <Link href="/chatbots/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Chatbot
          </Button>
        </Link>
      </div>

      <ChatbotsList initialChatbots={chatbotsWithSessions} />
    </div>
  );
}
