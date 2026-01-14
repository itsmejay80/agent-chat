"use client";

import { MessageSquare, Send, X, Sparkles } from "lucide-react";

interface WidgetPreviewProps {
  config: {
    position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    primary_color: string;
    background_color: string;
    text_color: string;
    border_radius: number;
    title: string;
    subtitle: string | null;
    welcome_message: string;
    placeholder: string;
  };
}

export function WidgetPreview({ config }: WidgetPreviewProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  // Convert hex to HSL for specific elements if needed, or just use config colors directly
  // For the preview we trust the config colors, but we style the container to match the "Editorial" theme

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Browser mockup */}
      <div className="flex h-10 items-center gap-2 border-b bg-white px-4 shadow-sm">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-400/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
          <div className="h-3 w-3 rounded-full bg-green-400/80" />
        </div>
        <div className="flex-1 mx-4 rounded-md bg-gray-50 px-3 py-1.5 text-center text-xs text-gray-400 font-medium border border-gray-100">
          yourwebsite.com
        </div>
      </div>

      {/* Page content mockup */}
      <div className="space-y-8 p-12 opacity-50">
        <div className="h-12 w-64 rounded-lg bg-gray-200" />
        <div className="space-y-4">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="h-32 rounded-xl bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-200" />
        </div>
      </div>

      {/* Chat Widget */}
      <div className={`absolute ${positionClasses[config.position]} z-10 flex flex-col items-end gap-4`}>
        {/* Chat Window */}
        <div
          className="w-[360px] overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            borderRadius: `${config.border_radius}px`,
            backgroundColor: config.background_color, // Use configurable background
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 20px 40px -4px rgba(60, 40, 30, 0.08)"
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 p-6 pb-4">
            <div 
                className="flex h-10 w-10 items-center justify-center rounded-[10px] shadow-sm"
                style={{ backgroundColor: config.primary_color }}
            >
                <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 
                className="font-serif text-lg font-semibold leading-tight tracking-tight"
                style={{ color: config.text_color }}
              >
                  {config.title}
              </h3>
              <div className="flex items-center gap-1.5 pt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" />
                  <span className="text-xs text-gray-500 font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex h-[320px] flex-col gap-4 overflow-y-auto px-6 py-2">
            
            {/* Welcome Message Mockup */}
            <div className="flex flex-col items-center py-6 text-center">
                <div 
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm"
                    style={{ color: config.primary_color }}
                >
                    <Sparkles className="h-8 w-8" />
                </div>
                <h4 className="font-serif text-xl font-semibold mb-2" style={{ color: config.text_color }}>Welcome!</h4>
                <p className="text-sm text-gray-500 max-w-[240px] leading-relaxed">
                    {config.welcome_message}
                </p>
            </div>

            {/* Example Agent Message */}
            <div className="flex justify-start">
               <div
                className="max-w-[85%] px-4 py-3.5 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                style={{
                  backgroundColor: "hsl(40, 20%, 92%)", // Muted cream for agent
                  color: config.text_color,
                  borderRadius: "18px",
                  borderBottomLeftRadius: "4px"
                }}
              >
                <p className="text-[15px] leading-relaxed">How can I help you today?</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-5 bg-transparent">
            <div className="flex items-end gap-3">
              <div className="flex-1 rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-3.5">
                  <div className="text-[15px] text-gray-400 pl-1">{config.placeholder}</div>
              </div>
              <button
                className="flex h-[50px] w-[50px] items-center justify-center rounded-2xl transition-transform hover:scale-105 active:scale-95"
                style={{ color: config.primary_color }}
              >
                <Send className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Launcher Button */}
        <button
          className="flex h-[60px] w-[60px] items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          style={{ 
              backgroundColor: config.primary_color,
              borderRadius: "24px", // Squircle
              boxShadow: "0 10px 25px -5px rgba(239, 99, 51, 0.4)"
          }}
        >
          <MessageSquare className="h-7 w-7 text-white stroke-[2px]" />
        </button>
      </div>
    </div>
  );
}
