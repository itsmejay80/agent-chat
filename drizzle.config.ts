import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/db/src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Exclude system schemas to avoid introspection issues with pg catalog CHECK constraints
  introspect: {
    casing: "preserve",
  },
});
