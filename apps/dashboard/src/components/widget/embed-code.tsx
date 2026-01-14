"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, Code2, Atom, Triangle } from "lucide-react";

interface EmbedCodeProps {
  chatbotId: string;
}

export function EmbedCode({ chatbotId }: EmbedCodeProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || "https://widget.yourdomain.com";

  const htmlCode = `<!-- Add this before the closing </body> tag -->
<script src="${widgetUrl}/chat-widget.js"></script>
<script>
  ChatWidget.init({
    chatbotId: "${chatbotId}"
  });
</script>`;

  const reactCode = `// Install: npm install @agent-chat/widget
import { ChatWidget } from '@agent-chat/widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget chatbotId="${chatbotId}" />
    </div>
  );
}`;

  const nextjsCode = `// Install: npm install @agent-chat/widget
// app/layout.tsx or pages/_app.tsx
import { ChatWidget } from '@agent-chat/widget';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ChatWidget chatbotId="${chatbotId}" />
      </body>
    </html>
  );
}`;

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="text-lg font-semibold">Embed Code</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <Tabs defaultValue="html">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="html" className="gap-2">
              <Code2 className="h-4 w-4" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="react" className="gap-2">
              <Atom className="h-4 w-4" />
              React
            </TabsTrigger>
            <TabsTrigger value="nextjs" className="gap-2">
              <Triangle className="h-4 w-4" />
              Next.js
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add this code snippet before the closing &lt;/body&gt; tag of your
              website.
            </p>
            <div className="relative group">
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300 font-mono">
                <code>{htmlCode}</code>
              </pre>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(htmlCode, "html")}
              >
                {copied === "html" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="react" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Install the React package and add the component to your app.
            </p>
            <div className="relative group">
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300 font-mono">
                <code>{reactCode}</code>
              </pre>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(reactCode, "react")}
              >
                {copied === "react" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="nextjs" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add the component to your root layout for app-wide availability.
            </p>
            <div className="relative group">
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-300 font-mono">
                <code>{nextjsCode}</code>
              </pre>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(nextjsCode, "nextjs")}
              >
                {copied === "nextjs" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
