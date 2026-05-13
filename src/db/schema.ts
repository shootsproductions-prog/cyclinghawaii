// Drizzle schema for cyclinghawaii.com.
//
// This file defines the database tables. It serves as the source of
// truth — `npm run db:push` will sync the live Neon database to match.
//
// Layout:
// - Auth.js core tables (users, accounts, sessions, verification_tokens)
//   are present because the @auth/drizzle-adapter expects them by name
//   and column. We extend `users` with platform-specific fields
//   (Strava metadata, club join state, etc.).
// - Platform tables (club_members, event_rsvps, …) will land alongside
//   as we build each feature.

import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  boolean,
} from "drizzle-orm/pg-core";

// ─── Auth.js core (extended with platform fields) ────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),

  // ─── Platform extensions ────────────────────────────────────────
  // Username for /[username] profile pages. Nullable until claimed.
  // Lowercase, unique, kebab-case enforced in app code.
  username: text("username").unique(),

  // Strava-specific. Populated when the user signs in via Strava.
  // Stored separately from `accounts.providerAccountId` so we can query
  // and join easily without going through Auth.js's account table.
  stravaAthleteId: text("strava_athlete_id").unique(),
  stravaPremium: boolean("strava_premium").default(false).notNull(),
  // Free-form area used for club bio, sponsored profile blurb, etc.
  bio: text("bio"),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// Convenient TS types — use these instead of `typeof users.$inferSelect`
// at call sites for readability.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
