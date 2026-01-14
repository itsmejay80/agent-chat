import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  bigint,
  jsonb,
  timestamp,
  inet,
  index,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),

    plan: varchar("plan", { length: 50 }).default("free"),
    stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
    stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),

    max_chatbots: integer("max_chatbots").default(1),
    max_messages_per_month: integer("max_messages_per_month").default(1000),
    max_knowledge_sources: integer("max_knowledge_sources").default(5),

    messages_this_month: integer("messages_this_month").default(0),
    usage_reset_at: timestamp("usage_reset_at", { withTimezone: true, mode: "string" }).defaultNow(),

    settings: jsonb("settings").default({}),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tenants_slug_unique").on(table.slug),
    index("idx_tenants_slug").on(table.slug),
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    tenant_id: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    full_name: varchar("full_name", { length: 255 }),
    avatar_url: text("avatar_url"),

    role: varchar("role", { length: 50 }).default("member"),
    preferences: jsonb("preferences").default({}),

    last_login_at: timestamp("last_login_at", { withTimezone: true, mode: "string" }),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_users_tenant_id").on(table.tenant_id),
    index("idx_users_email").on(table.email),
  ]
);

export const chatbots = pgTable(
  "chatbots",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    tenant_id: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),
    description: varchar("description", { length: 500 }),

    system_prompt: text("system_prompt").notNull().default("You are a helpful assistant."),
    model: varchar("model", { length: 100 }).default("gemini-2.0-flash"),
    temperature: numeric("temperature", { precision: 3, scale: 2 }).default("0.7"),
    max_tokens: integer("max_tokens").default(2048),

    is_active: boolean("is_active").default(true),

    settings: jsonb("settings").default({}),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_chatbots_tenant_id").on(table.tenant_id),
    index("idx_chatbots_is_active").on(table.is_active),
  ]
);

export const widget_configs = pgTable(
  "widget_configs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    chatbot_id: uuid("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),

    position: varchar("position", { length: 20 }).default("bottom-right"),

    primary_color: varchar("primary_color", { length: 7 }).default("#6366f1"),
    background_color: varchar("background_color", { length: 7 }).default("#ffffff"),
    text_color: varchar("text_color", { length: 7 }).default("#1f2937"),
    font_family: varchar("font_family", { length: 255 }).default("Inter, system-ui, sans-serif"),
    border_radius: integer("border_radius").default(12),

    title: varchar("title", { length: 50 }).default("Chat with us"),
    subtitle: varchar("subtitle", { length: 100 }),
    welcome_message: varchar("welcome_message", { length: 500 }).default("Hi! How can I help you today?"),
    placeholder: varchar("placeholder", { length: 100 }).default("Type your message..."),

    launcher_icon: varchar("launcher_icon", { length: 20 }).default("chat"),
    launcher_icon_url: text("launcher_icon_url"),

    auto_open: boolean("auto_open").default(false),
    auto_open_delay: integer("auto_open_delay").default(3000),
    show_branding: boolean("show_branding").default(true),

    allowed_domains: text("allowed_domains").array().default([]),

    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("widget_configs_chatbot_id_unique").on(table.chatbot_id),
    index("idx_widget_configs_chatbot_id").on(table.chatbot_id),
  ]
);

export const knowledge_sources = pgTable(
  "knowledge_sources",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    chatbot_id: uuid("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),

    type: varchar("type", { length: 20 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),

    file_url: text("file_url"),
    file_name: varchar("file_name", { length: 255 }),
    file_mime_type: varchar("file_mime_type", { length: 100 }),
    file_size: integer("file_size"),

    source_url: text("source_url"),

    text_content: text("text_content"),

    status: varchar("status", { length: 20 }).default("pending"),
    error_message: text("error_message"),
    chunks_count: integer("chunks_count").default(0),

    last_processed_at: timestamp("last_processed_at", { withTimezone: true, mode: "string" }),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_knowledge_sources_chatbot_id").on(table.chatbot_id),
    index("idx_knowledge_sources_status").on(table.status),
  ]
);

export const knowledge_chunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    source_id: uuid("source_id").notNull().references(() => knowledge_sources.id, { onDelete: "cascade" }),
    chatbot_id: uuid("chatbot_id").notNull().references(() => chatbots.id, { onDelete: "cascade" }),

    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),

    metadata: jsonb("metadata").default({}),
    token_count: integer("token_count").notNull(),

    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_knowledge_chunks_source_id").on(table.source_id),
    index("idx_knowledge_chunks_chatbot_id").on(table.chatbot_id),
  ]
);

export const adk_sessions = pgTable(
  "adk_sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    app_name: varchar("app_name", { length: 255 }).notNull(),
    user_id: varchar("user_id", { length: 255 }).notNull(),
    chatbot_id: uuid("chatbot_id").references(() => chatbots.id, { onDelete: "cascade" }),

    state: jsonb("state").default({}),
    last_update_time: timestamp("last_update_time", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),

    visitor_id: varchar("visitor_id", { length: 255 }),
    visitor_name: varchar("visitor_name", { length: 255 }),
    visitor_email: varchar("visitor_email", { length: 255 }),
    page_url: text("page_url"),
    user_agent: text("user_agent"),
  },
  (table) => [
    index("idx_adk_sessions_app_user").on(table.app_name, table.user_id),
    index("idx_adk_sessions_chatbot").on(table.chatbot_id),
    index("idx_adk_sessions_last_update").on(table.last_update_time),
  ]
);

export const adk_events = pgTable(
  "adk_events",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    session_id: varchar("session_id", { length: 255 })
      .notNull()
      .references(() => adk_sessions.id, { onDelete: "cascade" }),

    invocation_id: varchar("invocation_id", { length: 255 }).notNull(),
    author: varchar("author", { length: 255 }),

    content: jsonb("content"),
    actions: jsonb("actions").default(
      sql`'{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{},"requestedToolConfirmations":{}}'::jsonb`
    ),

    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    branch: varchar("branch", { length: 255 }),
    long_running_tool_ids: text("long_running_tool_ids").array(),

    grounding_metadata: jsonb("grounding_metadata"),
    partial: boolean("partial").default(false),
    turn_complete: boolean("turn_complete"),
    error_code: varchar("error_code", { length: 100 }),
    error_message: text("error_message"),
    custom_metadata: jsonb("custom_metadata"),
    usage_metadata: jsonb("usage_metadata"),
    finish_reason: varchar("finish_reason", { length: 50 }),

    created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_adk_events_session").on(table.session_id),
    index("idx_adk_events_timestamp").on(table.timestamp),
    index("idx_adk_events_session_timestamp").on(table.session_id, table.timestamp),
  ]
);
