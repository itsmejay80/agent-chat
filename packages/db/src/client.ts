import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let cached: PostgresJsDatabase<typeof schema> | undefined;

export function getDb() {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required (Supabase Postgres connection string)");
  }

  const client = postgres(connectionString, {
    prepare: false,
  });

  cached = drizzle(client, { schema });
  return cached;
}
