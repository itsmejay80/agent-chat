export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = any;

export type Tables = Record<string, unknown>;
export type InsertTables = Record<string, unknown>;
export type UpdateTables = Record<string, unknown>;

export interface Tenant {
  id: string;
  name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  tenant_id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Chatbot {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  settings: Json;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  id: string;
  chatbot_id: string;
  position: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeSource {
  id: string;
  chatbot_id: string;
  type?: string | null;
  name?: string | null;
  config?: Json;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeChunk {
  id: string;
  source_id: string;
  chatbot_id?: string | null;
  content?: string | null;
  metadata?: Json;
  created_at?: string;
}

