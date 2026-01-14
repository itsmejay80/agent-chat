import { relations } from "drizzle-orm/relations";
import { tenants, users, chatbots, knowledgeSources, widgetConfigs, adkSessions, adkEvents, knowledgeChunks } from "./schema";

export const usersRelations = relations(users, ({one}) => ({
	tenant: one(tenants, {
		fields: [users.tenantId],
		references: [tenants.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	users: many(users),
	chatbots: many(chatbots),
}));

export const knowledgeSourcesRelations = relations(knowledgeSources, ({one, many}) => ({
	chatbot: one(chatbots, {
		fields: [knowledgeSources.chatbotId],
		references: [chatbots.id]
	}),
	knowledgeChunks: many(knowledgeChunks),
}));

export const chatbotsRelations = relations(chatbots, ({one, many}) => ({
	knowledgeSources: many(knowledgeSources),
	tenant: one(tenants, {
		fields: [chatbots.tenantId],
		references: [tenants.id]
	}),
	widgetConfigs: many(widgetConfigs),
	adkSessions: many(adkSessions),
	knowledgeChunks: many(knowledgeChunks),
}));

export const widgetConfigsRelations = relations(widgetConfigs, ({one}) => ({
	chatbot: one(chatbots, {
		fields: [widgetConfigs.chatbotId],
		references: [chatbots.id]
	}),
}));

export const adkEventsRelations = relations(adkEvents, ({one}) => ({
	adkSession: one(adkSessions, {
		fields: [adkEvents.sessionId],
		references: [adkSessions.id]
	}),
}));

export const adkSessionsRelations = relations(adkSessions, ({one, many}) => ({
	adkEvents: many(adkEvents),
	chatbot: one(chatbots, {
		fields: [adkSessions.chatbotId],
		references: [chatbots.id]
	}),
}));

export const knowledgeChunksRelations = relations(knowledgeChunks, ({one}) => ({
	knowledgeSource: one(knowledgeSources, {
		fields: [knowledgeChunks.sourceId],
		references: [knowledgeSources.id]
	}),
	chatbot: one(chatbots, {
		fields: [knowledgeChunks.chatbotId],
		references: [chatbots.id]
	}),
}));