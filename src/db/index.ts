// Drizzle client. Single instance, used everywhere.
//
// We use Neon's HTTP driver for serverless-friendly cold starts —
// Vercel functions get sub-100ms query latency without long-lived
// connections. Postgres connection pooling is handled by Neon's
// pooler endpoint (the DATABASE_URL Vercel provisions points at the
// pooler by default).
//
// Build-time fallback: the Auth.js DrizzleAdapter introspects the
// client at module-init time, so we MUST hand it a real Neon client
// even when DATABASE_URL isn't set yet (e.g. during initial build
// before provisioning, or during page-data collection in CI). The
// dummy host below is syntactically valid but unreachable; actual
// queries will fail loudly at request time if DATABASE_URL is missing.
//
// Import as: `import { db } from "@/db";`

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  "postgres://placeholder:placeholder@localhost.invalid/placeholder";

if (
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_URL &&
  process.env.NODE_ENV !== "test"
) {
  console.warn(
    "[db] No DATABASE_URL set — using placeholder. Queries will fail at runtime."
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
