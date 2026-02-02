import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Import schema from the web app
// Note: In production, you may want to use a shared package or copy the schema
import * as schema from "../../nxrthstack/lib/db/schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Re-export schema for convenience
export * from "../../nxrthstack/lib/db/schema.js";
