import type { Chatbot, DBWidgetConfig } from "@agent-chat/shared";

// Simple in-memory cache for chatbot configurations
// In production, consider using Redis or another caching solution

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// Knowledge entry type for caching
export interface KnowledgeEntry {
  id: string;
  name: string;
  textContent: string;
}

class ConfigCache {
  private chatbots = new Map<string, CacheEntry<Chatbot>>();
  private widgets = new Map<string, CacheEntry<DBWidgetConfig>>();
  private knowledge = new Map<string, CacheEntry<KnowledgeEntry[]>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  setChatbot(id: string, data: Chatbot, ttl = this.defaultTTL): void {
    this.chatbots.set(id, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  getChatbot(id: string): Chatbot | null {
    const entry = this.chatbots.get(id);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.chatbots.delete(id);
      return null;
    }

    return entry.data;
  }

  setWidgetConfig(chatbotId: string, data: DBWidgetConfig, ttl = this.defaultTTL): void {
    this.widgets.set(chatbotId, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  getWidgetConfig(chatbotId: string): DBWidgetConfig | null {
    const entry = this.widgets.get(chatbotId);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.widgets.delete(chatbotId);
      return null;
    }

    return entry.data;
  }

  invalidateChatbot(id: string): void {
    this.chatbots.delete(id);
  }

  invalidateWidgetConfig(chatbotId: string): void {
    this.widgets.delete(chatbotId);
  }

  setKnowledge(chatbotId: string, data: KnowledgeEntry[], ttl = this.defaultTTL): void {
    this.knowledge.set(chatbotId, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  getKnowledge(chatbotId: string): KnowledgeEntry[] | null {
    const entry = this.knowledge.get(chatbotId);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.knowledge.delete(chatbotId);
      return null;
    }

    return entry.data;
  }

  invalidateKnowledge(chatbotId: string): void {
    this.knowledge.delete(chatbotId);
  }

  invalidateAll(chatbotId: string): void {
    this.invalidateChatbot(chatbotId);
    this.invalidateWidgetConfig(chatbotId);
    this.invalidateKnowledge(chatbotId);
  }

  clear(): void {
    this.chatbots.clear();
    this.widgets.clear();
    this.knowledge.clear();
  }
}

export const configCache = new ConfigCache();
