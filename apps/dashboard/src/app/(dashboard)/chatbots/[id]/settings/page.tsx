import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatbotForm } from "@/components/chatbots/chatbot-form";
import type { Chatbot } from "@agent-chat/shared";

interface ChatbotSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatbotSettingsPage({
  params,
}: ChatbotSettingsPageProps) {
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

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <ChatbotForm chatbot={chatbot as Chatbot} mode="edit" />
    </div>
  );
}
