// Re-export all types
export * from "./types";

// Re-export database types with DB prefix to avoid conflicts
export type {
  Database,
  Json,
  Tables,
  InsertTables,
  UpdateTables,
} from "./database.types";

// Export database row types with DB prefix
export type {
  Tenant,
  User,
  Chatbot,
  WidgetConfig as DBWidgetConfig,
  KnowledgeSource as DBKnowledgeSource,
  KnowledgeChunk as DBKnowledgeChunk,
} from "./database.types";
