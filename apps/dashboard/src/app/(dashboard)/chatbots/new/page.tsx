import { ChatbotForm } from "@/components/chatbots/chatbot-form";

export default function NewChatbotPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Chatbot</h1>
        <p className="text-muted-foreground">
          Set up a new AI chatbot for your website
        </p>
      </div>

      <ChatbotForm mode="create" />
    </div>
  );
}
