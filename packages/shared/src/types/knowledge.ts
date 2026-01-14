import { z } from "zod";

// Knowledge source types
export const KnowledgeSourceTypeSchema = z.enum([
  "file",      // Uploaded files (PDF, TXT, etc.)
  "url",       // Web pages to scrape
  "text",      // Direct text input
  "sitemap",   // Sitemap to crawl
]);

export type KnowledgeSourceType = z.infer<typeof KnowledgeSourceTypeSchema>;

// Processing status for knowledge sources
export const ProcessingStatusSchema = z.enum([
  "pending",     // Not yet processed
  "processing",  // Currently being processed
  "completed",   // Successfully processed
  "failed",      // Processing failed
]);

export type ProcessingStatus = z.infer<typeof ProcessingStatusSchema>;

// Knowledge source schema
export const KnowledgeSourceSchema = z.object({
  id: z.string().uuid(),
  chatbotId: z.string().uuid(),
  type: KnowledgeSourceTypeSchema,
  name: z.string().min(1).max(255),
  
  // Source-specific data
  fileUrl: z.string().url().optional(),      // For file type - storage URL
  fileName: z.string().optional(),            // Original file name
  fileMimeType: z.string().optional(),        // MIME type
  fileSize: z.number().optional(),            // Size in bytes
  sourceUrl: z.string().url().optional(),     // For url/sitemap type
  textContent: z.string().optional(),         // For text type
  
  // Processing info
  status: ProcessingStatusSchema.default("pending"),
  errorMessage: z.string().optional(),
  chunksCount: z.number().default(0),
  
  // Metadata
  lastProcessedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;

// Schema for creating a knowledge source
export const CreateKnowledgeSourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("file"),
    name: z.string().min(1).max(255),
    fileUrl: z.string().url(),
    fileName: z.string(),
    fileMimeType: z.string(),
    fileSize: z.number(),
  }),
  z.object({
    type: z.literal("url"),
    name: z.string().min(1).max(255),
    sourceUrl: z.string().url(),
  }),
  z.object({
    type: z.literal("text"),
    name: z.string().min(1).max(255),
    textContent: z.string().min(1),
  }),
  z.object({
    type: z.literal("sitemap"),
    name: z.string().min(1).max(255),
    sourceUrl: z.string().url(),
  }),
]);

export type CreateKnowledgeSourceInput = z.infer<typeof CreateKnowledgeSourceSchema>;

// Knowledge chunk (for vector storage)
export const KnowledgeChunkSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid(),
  chatbotId: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()).optional(), // Vector embedding
  metadata: z.object({
    pageNumber: z.number().optional(),
    sectionTitle: z.string().optional(),
    sourceUrl: z.string().optional(),
    chunkIndex: z.number(),
  }),
  tokenCount: z.number(),
  createdAt: z.string().datetime(),
});

export type KnowledgeChunk = z.infer<typeof KnowledgeChunkSchema>;

// Search result from vector similarity search
export interface KnowledgeSearchResult {
  chunk: KnowledgeChunk;
  source: KnowledgeSource;
  similarity: number;
}
