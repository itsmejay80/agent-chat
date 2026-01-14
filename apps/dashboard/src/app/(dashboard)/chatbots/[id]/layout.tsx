import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Settings, Palette, Database } from "lucide-react";
import type { Chatbot } from "@agent-chat/shared";

interface ChatbotLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function ChatbotLayout({
  children,
  params,
}: ChatbotLayoutProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: chatbot, error } = await supabase
    .from("chatbots")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !chatbot) {
    notFound();
  }

  const typedChatbot = chatbot as Chatbot;

  const navItems = [
    { href: `/chatbots/${id}`, label: "Overview", icon: Bot },
    { href: `/chatbots/${id}/settings`, label: "Settings", icon: Settings },
    { href: `/chatbots/${id}/widget`, label: "Widget", icon: Palette },
    { href: `/chatbots/${id}/knowledge`, label: "Knowledge", icon: Database },
  ];

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {typedChatbot.name}
            </h1>
            <p className="text-muted-foreground">
              {typedChatbot.description || "No description"}
            </p>
          </div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-sm ${
            typedChatbot.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {typedChatbot.is_active ? "Active" : "Inactive"}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <TabsTrigger value={item.href} className="gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </TabsTrigger>
            </Link>
          ))}
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}
