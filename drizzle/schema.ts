import { pgTable, index, uniqueIndex, uuid, varchar, integer, timestamp, jsonb, foreignKey, text, numeric, boolean, bigint, vector } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const tenants = pgTable("tenants", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	plan: varchar({ length: 50 }).default('free'),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	maxChatbots: integer("max_chatbots").default(1),
	maxMessagesPerMonth: integer("max_messages_per_month").default(1000),
	maxKnowledgeSources: integer("max_knowledge_sources").default(5),
	messagesThisMonth: integer("messages_this_month").default(0),
	usageResetAt: timestamp("usage_reset_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tenants_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	uniqueIndex("tenants_slug_unique").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: uuid().primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	email: varchar({ length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 255 }),
	avatarUrl: text("avatar_url"),
	role: varchar({ length: 50 }).default('member'),
	preferences: jsonb().default({}),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "users_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const knowledgeSources = pgTable("knowledge_sources", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	chatbotId: uuid("chatbot_id").notNull(),
	type: varchar({ length: 20 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	fileUrl: text("file_url"),
	fileName: varchar("file_name", { length: 255 }),
	fileMimeType: varchar("file_mime_type", { length: 100 }),
	fileSize: integer("file_size"),
	sourceUrl: text("source_url"),
	textContent: text("text_content"),
	status: varchar({ length: 20 }).default('pending'),
	errorMessage: text("error_message"),
	chunksCount: integer("chunks_count").default(0),
	lastProcessedAt: timestamp("last_processed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_knowledge_sources_chatbot_id").using("btree", table.chatbotId.asc().nullsLast().op("uuid_ops")),
	index("idx_knowledge_sources_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.chatbotId],
			foreignColumns: [chatbots.id],
			name: "knowledge_sources_chatbot_id_chatbots_id_fk"
		}).onDelete("cascade"),
]);

export const chatbots = pgTable("chatbots", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	tenantId: uuid("tenant_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: varchar({ length: 500 }),
	systemPrompt: text("system_prompt").default('You are a helpful assistant.').notNull(),
	model: varchar({ length: 100 }).default('gemini-2.0-flash'),
	temperature: numeric({ precision: 3, scale:  2 }).default('0.7'),
	maxTokens: integer("max_tokens").default(2048),
	isActive: boolean("is_active").default(true),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_chatbots_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_chatbots_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "chatbots_tenant_id_tenants_id_fk"
		}).onDelete("cascade"),
]);

export const widgetConfigs = pgTable("widget_configs", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	chatbotId: uuid("chatbot_id").notNull(),
	position: varchar({ length: 20 }).default('bottom-right'),
	primaryColor: varchar("primary_color", { length: 7 }).default('#6366f1'),
	backgroundColor: varchar("background_color", { length: 7 }).default('#ffffff'),
	textColor: varchar("text_color", { length: 7 }).default('#1f2937'),
	fontFamily: varchar("font_family", { length: 255 }).default('Inter, system-ui, sans-serif'),
	borderRadius: integer("border_radius").default(12),
	title: varchar({ length: 50 }).default('Chat with us'),
	subtitle: varchar({ length: 100 }),
	welcomeMessage: varchar("welcome_message", { length: 500 }).default('Hi! How can I help you today?'),
	placeholder: varchar({ length: 100 }).default('Type your message...'),
	launcherIcon: varchar("launcher_icon", { length: 20 }).default('chat'),
	launcherIconUrl: text("launcher_icon_url"),
	autoOpen: boolean("auto_open").default(false),
	autoOpenDelay: integer("auto_open_delay").default(3000),
	showBranding: boolean("show_branding").default(true),
	allowedDomains: text("allowed_domains").array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_widget_configs_chatbot_id").using("btree", table.chatbotId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("widget_configs_chatbot_id_unique").using("btree", table.chatbotId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.chatbotId],
			foreignColumns: [chatbots.id],
			name: "widget_configs_chatbot_id_chatbots_id_fk"
		}).onDelete("cascade"),
]);

export const adkEvents = pgTable("adk_events", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	sessionId: varchar("session_id", { length: 255 }).notNull(),
	invocationId: varchar("invocation_id", { length: 255 }).notNull(),
	author: varchar({ length: 255 }),
	content: jsonb(),
	actions: jsonb().default({"stateDelta":{},"artifactDelta":{},"requestedAuthConfigs":{},"requestedToolConfirmations":{}}),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timestamp: bigint({ mode: "number" }).notNull(),
	branch: varchar({ length: 255 }),
	longRunningToolIds: text("long_running_tool_ids").array(),
	groundingMetadata: jsonb("grounding_metadata"),
	partial: boolean().default(false),
	turnComplete: boolean("turn_complete"),
	errorCode: varchar("error_code", { length: 100 }),
	errorMessage: text("error_message"),
	customMetadata: jsonb("custom_metadata"),
	usageMetadata: jsonb("usage_metadata"),
	finishReason: varchar("finish_reason", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_adk_events_session").using("btree", table.sessionId.asc().nullsLast().op("text_ops")),
	index("idx_adk_events_session_timestamp").using("btree", table.sessionId.asc().nullsLast().op("int8_ops"), table.timestamp.asc().nullsLast().op("text_ops")),
	index("idx_adk_events_timestamp").using("btree", table.timestamp.asc().nullsLast().op("int8_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [adkSessions.id],
			name: "adk_events_session_id_adk_sessions_id_fk"
		}).onDelete("cascade"),
]);

export const adkSessions = pgTable("adk_sessions", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	appName: varchar("app_name", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	chatbotId: uuid("chatbot_id"),
	state: jsonb().default({}),
	lastUpdateTime: timestamp("last_update_time", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	visitorId: varchar("visitor_id", { length: 255 }),
	visitorName: varchar("visitor_name", { length: 255 }),
	visitorEmail: varchar("visitor_email", { length: 255 }),
	pageUrl: text("page_url"),
	userAgent: text("user_agent"),
}, (table) => [
	index("idx_adk_sessions_app_user").using("btree", table.appName.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("idx_adk_sessions_chatbot").using("btree", table.chatbotId.asc().nullsLast().op("uuid_ops")),
	index("idx_adk_sessions_last_update").using("btree", table.lastUpdateTime.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.chatbotId],
			foreignColumns: [chatbots.id],
			name: "adk_sessions_chatbot_id_chatbots_id_fk"
		}).onDelete("cascade"),
]);

export const knowledgeChunks = pgTable("knowledge_chunks", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	sourceId: uuid("source_id").notNull(),
	chatbotId: uuid("chatbot_id").notNull(),
	content: text().notNull(),
	embedding: vector({ dimensions: 768 }),
	metadata: jsonb().default({}),
	tokenCount: integer("token_count").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_knowledge_chunks_chatbot_id").using("btree", table.chatbotId.asc().nullsLast().op("uuid_ops")),
	index("idx_knowledge_chunks_source_id").using("btree", table.sourceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sourceId],
			foreignColumns: [knowledgeSources.id],
			name: "knowledge_chunks_source_id_knowledge_sources_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.chatbotId],
			foreignColumns: [chatbots.id],
			name: "knowledge_chunks_chatbot_id_chatbots_id_fk"
		}).onDelete("cascade"),
]);
