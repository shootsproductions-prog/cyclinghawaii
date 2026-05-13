// Auth.js v5 — user sign-in for cyclinghawaii.com.
//
// Two providers: Google (everyone) and Strava (cyclists, comes with
// athlete metadata). Session strategy is JWT so we don't need a database
// for v1 — we can add Postgres later when we want to persist user prefs,
// linked rides, etc.
//
// Note: this is SEPARATE from the rider OAuth flow at /api/auth/strava/*
// which is for the /roast multi-tenant profile pages. That flow stores
// long-lived Strava tokens encrypted in Blob; this flow is just identity.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  // Database sessions — every request reads the session row, so
  // changes (sign-out, username updates, premium flag) take effect
  // immediately. Slightly heavier than JWT but the correctness is
  // worth it for a platform that will grow user state.
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    {
      // Strava isn't a built-in Auth.js provider so we hand-roll it.
      // Scope is read-only — for richer profile features we'd bump to
      // activity:read_all, but this flow is identity-only for now.
      id: "strava",
      name: "Strava",
      type: "oauth",
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      authorization: {
        url: "https://www.strava.com/oauth/authorize",
        params: {
          scope: "read,profile:read_all",
          approval_prompt: "auto",
          response_type: "code",
        },
      },
      token: "https://www.strava.com/oauth/token",
      userinfo: "https://www.strava.com/api/v3/athlete",
      checks: ["state"],
      profile(profile: {
        id: number;
        firstname?: string;
        lastname?: string;
        profile?: string;
        city?: string;
        country?: string;
      }) {
        return {
          id: String(profile.id),
          name:
            [profile.firstname, profile.lastname].filter(Boolean).join(" ") ||
            `Athlete ${profile.id}`,
          email: null,
          image: profile.profile ?? null,
        };
      },
    },
  ],
  pages: {
    signIn: "/signin",
  },
  events: {
    // When a Strava sign-in completes, persist the athlete id and the
    // premium/summit flag onto the user row. Auth.js stores the OAuth
    // profile id in `accounts.providerAccountId`, but we want fast
    // access from the user object (no join) for everyday queries like
    // "is this premium athlete on the leaderboard?"
    async signIn({ user, account, profile }) {
      if (
        account?.provider === "strava" &&
        user?.id &&
        profile &&
        typeof profile === "object"
      ) {
        const p = profile as { id?: number | string; premium?: boolean; summit?: boolean };
        const athleteId = p.id != null ? String(p.id) : undefined;
        const premium = Boolean(p.premium || p.summit);
        if (athleteId) {
          await db
            .update(schema.users)
            .set({
              stravaAthleteId: athleteId,
              stravaPremium: premium,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, user.id));
        }
      }
    },
  },
  callbacks: {
    // Surface extra fields on the session so client components can
    // gate features ("only Strava-premium users see this") without an
    // extra round-trip.
    async session({ session, user }) {
      if (session.user && user) {
        // Re-read the user row to pick up our extension fields. The
        // adapter only fills the Auth.js core fields by default.
        const rows = await db
          .select({
            username: schema.users.username,
            stravaAthleteId: schema.users.stravaAthleteId,
            stravaPremium: schema.users.stravaPremium,
          })
          .from(schema.users)
          .where(eq(schema.users.id, user.id))
          .limit(1);
        const row = rows[0];
        session.user.id = user.id;
        if (row) {
          session.user.username = row.username ?? undefined;
          session.user.stravaAthleteId = row.stravaAthleteId ?? undefined;
          session.user.stravaPremium = row.stravaPremium ?? false;
        }
      }
      return session;
    },
  },
});
