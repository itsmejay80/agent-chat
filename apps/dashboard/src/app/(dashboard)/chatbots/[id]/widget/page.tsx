"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/widget/color-picker";
import { PositionSelector } from "@/components/widget/position-selector";
import { WidgetPreview } from "@/components/widget/widget-preview";
import { EmbedCode } from "@/components/widget/embed-code";
import { Loader2, Save } from "lucide-react";

type Position = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface WidgetConfig {
  position: Position;
  primary_color: string;
  background_color: string;
  text_color: string;
  border_radius: number;
  title: string;
  subtitle: string | null;
  welcome_message: string;
  placeholder: string;
  auto_open: boolean;
  auto_open_delay: number;
  show_branding: boolean;
}

const defaultConfig: WidgetConfig = {
  position: "bottom-right",
  primary_color: "#6366f1",
  background_color: "#ffffff",
  text_color: "#1f2937",
  border_radius: 12,
  title: "Chat with us",
  subtitle: "We typically reply within minutes",
  welcome_message: "Hi! How can I help you today?",
  placeholder: "Type your message...",
  auto_open: false,
  auto_open_delay: 3,
  show_branding: true,
};

export default function WidgetConfigPage() {
  const params = useParams();
  const chatbotId = params.id as string;

  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch(`/api/chatbots/${chatbotId}/widget`);
        if (response.ok) {
          const data = await response.json();
          setConfig({
            position: data.position || defaultConfig.position,
            primary_color: data.primary_color || defaultConfig.primary_color,
            background_color: data.background_color || defaultConfig.background_color,
            text_color: data.text_color || defaultConfig.text_color,
            border_radius: data.border_radius ?? defaultConfig.border_radius,
            title: data.title || defaultConfig.title,
            subtitle: data.subtitle ?? defaultConfig.subtitle,
            welcome_message: data.welcome_message || defaultConfig.welcome_message,
            placeholder: data.placeholder || defaultConfig.placeholder,
            auto_open: data.auto_open ?? defaultConfig.auto_open,
            auto_open_delay: data.auto_open_delay ?? defaultConfig.auto_open_delay,
            show_branding: data.show_branding ?? defaultConfig.show_branding,
          });
        }
      } catch (err) {
        console.error("Failed to fetch widget config:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, [chatbotId]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/widget`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error("Failed to save widget configuration");
      }

      setSuccessMessage("Widget configuration saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-100 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ColorPicker
                label="Primary Color"
                value={config.primary_color}
                onChange={(color) =>
                  setConfig({ ...config, primary_color: color })
                }
              />

              <ColorPicker
                label="Background Color"
                value={config.background_color}
                onChange={(color) =>
                  setConfig({ ...config, background_color: color })
                }
              />

              <ColorPicker
                label="Text Color"
                value={config.text_color}
                onChange={(color) =>
                  setConfig({ ...config, text_color: color })
                }
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Border Radius</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.border_radius}px
                  </span>
                </div>
                <Slider
                  min={0}
                  max={24}
                  step={2}
                  value={[config.border_radius]}
                  onValueChange={([value]) =>
                    setConfig({ ...config, border_radius: value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Position</CardTitle>
            </CardHeader>
            <CardContent>
              <PositionSelector
                value={config.position}
                onChange={(position) => setConfig({ ...config, position })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={config.title}
                  onChange={(e) =>
                    setConfig({ ...config, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={config.subtitle || ""}
                  onChange={(e) =>
                    setConfig({ ...config, subtitle: e.target.value || null })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcome_message">Welcome Message</Label>
                <Input
                  id="welcome_message"
                  value={config.welcome_message}
                  onChange={(e) =>
                    setConfig({ ...config, welcome_message: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Input Placeholder</Label>
                <Input
                  id="placeholder"
                  value={config.placeholder}
                  onChange={(e) =>
                    setConfig({ ...config, placeholder: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Open</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically open the chat widget
                  </p>
                </div>
                <Switch
                  checked={config.auto_open}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, auto_open: checked })
                  }
                />
              </div>

              {config.auto_open && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Open Delay</Label>
                    <span className="text-sm text-muted-foreground">
                      {config.auto_open_delay}s
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={30}
                    step={1}
                    value={[config.auto_open_delay]}
                    onValueChange={([value]) =>
                      setConfig({ ...config, auto_open_delay: value })
                    }
                  />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Branding</Label>
                  <p className="text-sm text-muted-foreground">
                    Display &quot;Powered by&quot; badge
                  </p>
                </div>
                <Switch
                  checked={config.show_branding}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, show_branding: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <WidgetPreview config={config} />
            </CardContent>
          </Card>

          <EmbedCode chatbotId={chatbotId} />
        </div>
      </div>
    </div>
  );
}
