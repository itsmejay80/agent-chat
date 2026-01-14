"use client";

import { useState } from "react";
import { use } from "react";
import { AddKnowledgeDialog, KnowledgeList } from "@/components/knowledge";

interface KnowledgePageProps {
  params: Promise<{ id: string }>;
}

export default function KnowledgePage({ params }: KnowledgePageProps) {
  const { id } = use(params);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleKnowledgeAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground">
            Add information to help your chatbot answer questions accurately
          </p>
        </div>
        <AddKnowledgeDialog chatbotId={id} onSuccess={handleKnowledgeAdded} />
      </div>

      <KnowledgeList chatbotId={id} refreshTrigger={refreshTrigger} />
    </div>
  );
}
