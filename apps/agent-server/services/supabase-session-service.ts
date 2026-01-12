/**
 * SupabaseSessionService - Persistent session storage using Supabase
 * Implements Google ADK's BaseSessionService interface for database-backed sessions
 */
import {
  BaseSessionService,
  createSession,
} from "@google/adk";
import type {
  CreateSessionRequest,
  GetSessionRequest,
  ListSessionsRequest,
  DeleteSessionRequest,
  ListSessionsResponse,
  Session,
  Event,
} from "@google/adk";
import { getDb, schema } from "@agent-chat/db";
import { and, asc, desc, eq, gt } from "drizzle-orm";

/**
 * Extended session metadata for visitor tracking
 */
export interface SessionMetadata {
  chatbotId?: string;
  visitorId?: string;
  visitorName?: string;
  visitorEmail?: string;
  pageUrl?: string;
  userAgent?: string;
}

/**
 * Extended create session request with metadata
 */
export interface CreateSessionWithMetadataRequest extends CreateSessionRequest {
  metadata?: SessionMetadata;
}

/**
 * Database row types
 */
interface AdkSessionRow {
  id: string;
  app_name: string;
  user_id: string;
  chatbot_id: string | null;
  state: Record<string, unknown>;
  last_update_time: string;
  created_at: string;
  visitor_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  page_url: string | null;
  user_agent: string | null;
}

interface AdkEventRow {
  id: string;
  session_id: string;
  invocation_id: string;
  author: string | null;
  content: unknown;
  actions: unknown;
  timestamp: number;
  branch: string | null;
  long_running_tool_ids: string[] | null;
  grounding_metadata: unknown;
  partial: boolean;
  turn_complete: boolean | null;
  error_code: string | null;
  error_message: string | null;
  custom_metadata: unknown;
  usage_metadata: unknown;
  finish_reason: string | null;
  created_at: string;
}

const db = getDb();

/**
 * Supabase-backed implementation of ADK's SessionService
 * Persists sessions and events to PostgreSQL via Supabase
 */
export class SupabaseSessionService extends BaseSessionService {
  /**
   * Creates a new session in the database
   */
  async createSession(request: CreateSessionWithMetadataRequest): Promise<Session> {
    const sessionId = request.sessionId || `session_${crypto.randomUUID()}`;
    const now = new Date();

    try {
      await db.insert(schema.adk_sessions).values({
        id: sessionId,
        app_name: request.appName,
        user_id: request.userId,
        state: request.state || {},
        last_update_time: now.toISOString(),
        chatbot_id: request.metadata?.chatbotId || null,
        visitor_id: request.metadata?.visitorId || null,
        visitor_name: request.metadata?.visitorName || null,
        visitor_email: request.metadata?.visitorEmail || null,
        page_url: request.metadata?.pageUrl || null,
        user_agent: request.metadata?.userAgent || null,
      });
    } catch (error) {
      throw new Error(`Failed to create session: ${(error as Error).message}`);
    }

    return createSession({
      id: sessionId,
      appName: request.appName,
      userId: request.userId,
      state: request.state || {},
      events: [],
      lastUpdateTime: now.getTime(),
    });
  }

  /**
   * Retrieves a session with its events from the database
   */
  async getSession(request: GetSessionRequest): Promise<Session | undefined> {
    const [sessionRow] = await db
      .select()
      .from(schema.adk_sessions)
      .where(
        and(
          eq(schema.adk_sessions.id, request.sessionId),
          eq(schema.adk_sessions.app_name, request.appName),
          eq(schema.adk_sessions.user_id, request.userId)
        )
      )
      .limit(1);

    if (!sessionRow) {
      return undefined;
    }

    const typedSessionRow = sessionRow as AdkSessionRow;

    const eventsWhere = request.config?.afterTimestamp
      ? and(
          eq(schema.adk_events.session_id, request.sessionId),
          gt(schema.adk_events.timestamp, request.config.afterTimestamp)
        )!
      : eq(schema.adk_events.session_id, request.sessionId);

    const eventRows = await db
      .select()
      .from(schema.adk_events)
      .where(eventsWhere)
      .orderBy(asc(schema.adk_events.timestamp));

    // Convert database rows to Event objects
    let events: Event[] = (eventRows as AdkEventRow[]).map((row) => this.rowToEvent(row));

    // Apply numRecentEvents limit if specified (after fetching to ensure we get the most recent)
    if (request.config?.numRecentEvents && events.length > request.config.numRecentEvents) {
      events = events.slice(-request.config.numRecentEvents);
    }

    return createSession({
      id: typedSessionRow.id,
      appName: typedSessionRow.app_name,
      userId: typedSessionRow.user_id,
      state: typedSessionRow.state as Record<string, unknown>,
      events,
      lastUpdateTime: new Date(typedSessionRow.last_update_time).getTime(),
    });
  }

  /**
   * Lists all sessions for a user (without events for efficiency)
   */
  async listSessions(request: ListSessionsRequest): Promise<ListSessionsResponse> {
    const rows = await db
      .select()
      .from(schema.adk_sessions)
      .where(
        and(
          eq(schema.adk_sessions.app_name, request.appName),
          eq(schema.adk_sessions.user_id, request.userId)
        )
      )
      .orderBy(desc(schema.adk_sessions.last_update_time));

    const sessions: Session[] = (rows as AdkSessionRow[]).map((row) => {
      return createSession({
        id: row.id,
        appName: row.app_name,
        userId: row.user_id,
        state: row.state as Record<string, unknown>,
        events: [], // Don't load events for list operation
        lastUpdateTime: new Date(row.last_update_time).getTime(),
      });
    });

    return { sessions };
  }

  /**
   * Deletes a session and all its events (cascades automatically)
   */
  async deleteSession(request: DeleteSessionRequest): Promise<void> {
    try {
      await db
        .delete(schema.adk_sessions)
        .where(
          and(
            eq(schema.adk_sessions.id, request.sessionId),
            eq(schema.adk_sessions.app_name, request.appName),
            eq(schema.adk_sessions.user_id, request.userId)
          )
        );
    } catch (error) {
      throw new Error(`Failed to delete session: ${(error as Error).message}`);
    }
  }

  /**
   * Appends an event to a session and persists to database
   */
  override async appendEvent({
    session,
    event,
  }: {
    session: Session;
    event: Event;
  }): Promise<Event> {
    // Call parent to handle state merging and event ID assignment
    const appendedEvent = await super.appendEvent({ session, event });

    // Persist event to database
    try {
      await db.insert(schema.adk_events).values(this.eventToRow(session.id, appendedEvent));
    } catch (error) {
      throw new Error(`Failed to append event: ${(error as Error).message}`);
    }

    // Update session's last_update_time and state
    try {
      await db
        .update(schema.adk_sessions)
        .set({
          last_update_time: new Date().toISOString(),
          state: session.state,
        })
        .where(eq(schema.adk_sessions.id, session.id));
    } catch (error) {
      throw new Error(`Failed to update session: ${(error as Error).message}`);
    }

    return appendedEvent;
  }

  /**
   * Converts a database row to an Event object
   */
  private rowToEvent(row: AdkEventRow): Event {
    return {
      id: row.id,
      invocationId: row.invocation_id,
      author: row.author || undefined,
      content: row.content as Event["content"],
      actions: row.actions as Event["actions"],
      timestamp: row.timestamp,
      branch: row.branch || undefined,
      longRunningToolIds: row.long_running_tool_ids || undefined,
      groundingMetadata: row.grounding_metadata as Event["groundingMetadata"],
      partial: row.partial,
      turnComplete: row.turn_complete || undefined,
      errorCode: row.error_code || undefined,
      errorMessage: row.error_message || undefined,
      customMetadata: row.custom_metadata as Event["customMetadata"],
      usageMetadata: row.usage_metadata as Event["usageMetadata"],
      finishReason: row.finish_reason as Event["finishReason"],
    };
  }

  /**
   * Converts an Event object to a database row
   */
  private eventToRow(
    sessionId: string,
    event: Event
  ): Omit<AdkEventRow, "created_at"> {
    return {
      id: event.id,
      session_id: sessionId,
      invocation_id: event.invocationId,
      author: event.author || null,
      content: event.content || null,
      actions: event.actions,
      timestamp: event.timestamp,
      branch: event.branch || null,
      long_running_tool_ids: event.longRunningToolIds || null,
      grounding_metadata: event.groundingMetadata || null,
      partial: event.partial || false,
      turn_complete: event.turnComplete || null,
      error_code: event.errorCode || null,
      error_message: event.errorMessage || null,
      custom_metadata: event.customMetadata || null,
      usage_metadata: event.usageMetadata || null,
      finish_reason: event.finishReason || null,
    };
  }
}
