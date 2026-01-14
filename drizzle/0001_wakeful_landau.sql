CREATE TABLE "adk_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"invocation_id" varchar(255) NOT NULL,
	"author" varchar(255),
	"content" jsonb,
	"actions" jsonb DEFAULT '{"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{},"requestedToolConfirmations":{}}'::jsonb,
	"timestamp" bigint NOT NULL,
	"branch" varchar(255),
	"long_running_tool_ids" text[],
	"grounding_metadata" jsonb,
	"partial" boolean DEFAULT false,
	"turn_complete" boolean,
	"error_code" varchar(100),
	"error_message" text,
	"custom_metadata" jsonb,
	"usage_metadata" jsonb,
	"finish_reason" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adk_sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"app_name" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"chatbot_id" uuid,
	"state" jsonb DEFAULT '{}'::jsonb,
	"last_update_time" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"visitor_id" varchar(255),
	"visitor_name" varchar(255),
	"visitor_email" varchar(255),
	"page_url" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"chatbot_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb DEFAULT '{}'::jsonb,
	"session_id" varchar(255),
	"visitor_id" varchar(255),
	"conversation_id" uuid,
	"page_url" text,
	"user_agent" text,
	"ip_address" "inet",
	"country" varchar(2),
	"city" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatbots" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"system_prompt" text DEFAULT 'You are a helpful assistant.' NOT NULL,
	"model" varchar(100) DEFAULT 'gemini-2.0-flash',
	"temperature" numeric(3, 2) DEFAULT '0.7',
	"max_tokens" integer DEFAULT 2048,
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"source_id" uuid NOT NULL,
	"chatbot_id" uuid NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"token_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_sources" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"chatbot_id" uuid NOT NULL,
	"type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"file_url" text,
	"file_name" varchar(255),
	"file_mime_type" varchar(100),
	"file_size" integer,
	"source_url" text,
	"text_content" text,
	"status" varchar(20) DEFAULT 'pending',
	"error_message" text,
	"chunks_count" integer DEFAULT 0,
	"last_processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"plan" varchar(50) DEFAULT 'free',
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"max_chatbots" integer DEFAULT 1,
	"max_messages_per_month" integer DEFAULT 1000,
	"max_knowledge_sources" integer DEFAULT 5,
	"messages_this_month" integer DEFAULT 0,
	"usage_reset_at" timestamp with time zone DEFAULT now(),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255),
	"avatar_url" text,
	"role" varchar(50) DEFAULT 'member',
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_configs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"chatbot_id" uuid NOT NULL,
	"position" varchar(20) DEFAULT 'bottom-right',
	"primary_color" varchar(7) DEFAULT '#6366f1',
	"background_color" varchar(7) DEFAULT '#ffffff',
	"text_color" varchar(7) DEFAULT '#1f2937',
	"font_family" varchar(255) DEFAULT 'Inter, system-ui, sans-serif',
	"border_radius" integer DEFAULT 12,
	"title" varchar(50) DEFAULT 'Chat with us',
	"subtitle" varchar(100),
	"welcome_message" varchar(500) DEFAULT 'Hi! How can I help you today?',
	"placeholder" varchar(100) DEFAULT 'Type your message...',
	"launcher_icon" varchar(20) DEFAULT 'chat',
	"launcher_icon_url" text,
	"auto_open" boolean DEFAULT false,
	"auto_open_delay" integer DEFAULT 3000,
	"show_branding" boolean DEFAULT true,
	"allowed_domains" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "adk_events" ADD CONSTRAINT "adk_events_session_id_adk_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."adk_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "adk_sessions" ADD CONSTRAINT "adk_sessions_chatbot_id_chatbots_id_fk" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_chatbot_id_chatbots_id_fk" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chatbots" ADD CONSTRAINT "chatbots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_source_id_knowledge_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_chatbot_id_chatbots_id_fk" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_sources" ADD CONSTRAINT "knowledge_sources_chatbot_id_chatbots_id_fk" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_chatbot_id_chatbots_id_fk" FOREIGN KEY ("chatbot_id") REFERENCES "public"."chatbots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_adk_events_session" ON "adk_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_adk_events_timestamp" ON "adk_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_adk_events_session_timestamp" ON "adk_events" USING btree ("session_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_adk_sessions_app_user" ON "adk_sessions" USING btree ("app_name","user_id");--> statement-breakpoint
CREATE INDEX "idx_adk_sessions_chatbot" ON "adk_sessions" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "idx_adk_sessions_last_update" ON "adk_sessions" USING btree ("last_update_time");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_chatbot_id" ON "analytics_events" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_tenant_id" ON "analytics_events" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_event_type" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_created_at" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_session_id" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_chatbot_type_created" ON "analytics_events" USING btree ("chatbot_id","event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_chatbots_tenant_id" ON "chatbots" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_chatbots_is_active" ON "chatbots" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_knowledge_chunks_source_id" ON "knowledge_chunks" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_chunks_chatbot_id" ON "knowledge_chunks" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_sources_chatbot_id" ON "knowledge_sources" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_sources_status" ON "knowledge_sources" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_unique" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tenants_slug" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_users_tenant_id" ON "users" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "widget_configs_chatbot_id_unique" ON "widget_configs" USING btree ("chatbot_id");--> statement-breakpoint
CREATE INDEX "idx_widget_configs_chatbot_id" ON "widget_configs" USING btree ("chatbot_id");