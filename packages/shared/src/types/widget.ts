import { z } from "zod";

// Widget position options
export const WidgetPositionSchema = z.enum([
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
]);

export type WidgetPosition = z.infer<typeof WidgetPositionSchema>;

// Widget theme configuration
export const WidgetThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#6366f1"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#ffffff"),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#1f2937"),
  fontFamily: z.string().default("Inter, system-ui, sans-serif"),
  borderRadius: z.number().min(0).max(24).default(12),
});

export type WidgetTheme = z.infer<typeof WidgetThemeSchema>;

// Widget configuration schema
export const WidgetConfigSchema = z.object({
  id: z.string().uuid(),
  chatbotId: z.string().uuid(),
  
  // Appearance
  position: WidgetPositionSchema.default("bottom-right"),
  theme: WidgetThemeSchema.default({}),
  
  // Branding
  title: z.string().max(50).default("Chat with us"),
  subtitle: z.string().max(100).optional(),
  welcomeMessage: z.string().max(500).default("Hi! How can I help you today?"),
  placeholder: z.string().max(100).default("Type your message..."),
  
  // Launcher button
  launcherIcon: z.enum(["chat", "message", "help", "custom"]).default("chat"),
  launcherIconUrl: z.string().url().optional(),
  
  // Behavior
  autoOpen: z.boolean().default(false),
  autoOpenDelay: z.number().min(0).max(60000).default(3000),
  showBranding: z.boolean().default(true),
  
  // Allowed domains for embedding
  allowedDomains: z.array(z.string()).default([]),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

// Schema for creating widget config
export const CreateWidgetConfigSchema = WidgetConfigSchema.omit({
  id: true,
  chatbotId: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateWidgetConfigInput = z.infer<typeof CreateWidgetConfigSchema>;

// Schema for updating widget config
export const UpdateWidgetConfigSchema = CreateWidgetConfigSchema.partial();

export type UpdateWidgetConfigInput = z.infer<typeof UpdateWidgetConfigSchema>;

// Public widget config (returned to embed script)
export interface PublicWidgetConfig {
  chatbotId: string;
  position: WidgetPosition;
  theme: WidgetTheme;
  title: string;
  subtitle?: string;
  welcomeMessage: string;
  placeholder: string;
  launcherIcon: string;
  launcherIconUrl?: string;
  autoOpen: boolean;
  autoOpenDelay: number;
  showBranding: boolean;
}
