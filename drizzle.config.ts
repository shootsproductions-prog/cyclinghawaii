// Drizzle Kit configuration — used by `npm run db:push`, `db:studio`, etc.
//
// Reads DATABASE_URL from .env.local (pulled from Vercel via `vercel env pull`).

import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "",
  },
  verbose: true,
  strict: true,
});
