import { createClient } from "@supabase/supabase-js";
// Import Database type - regenerate after running migrations:
// npx supabase gen types typescript --local > packages/shared/src/database.types.ts
// TODO: Database type includes new adk_sessions/adk_events tables after migration
// @ts-ignore - Type errors will be resolved after regenerating types
// @ts-nocheck
import type { Database } from "../../../packages/shared/src/database.types";

// Re-export types for use in other files
export type { Database };
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Create a Supabase client with the service role key for server-side operations
// This bypasses RLS for admin operations
export const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create a Supabase client with the anon key for public operations
export const supabasePublic = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
