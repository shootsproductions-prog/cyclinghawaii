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

export const { handlers, signIn, signOut, auth } = NextAuth({
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
  callbacks: {
    // Surface the provider on the session so the UI can show "Signed in
    // with Strava" etc. and (later) gate cyclist-only features.
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
        // Stash Strava athlete id for later — we'll likely use this to
        // auto-link a Strava-authed user to their /roast profile.
        if (account.provider === "strava" && profile && "id" in profile) {
          token.stravaAthleteId = String(profile.id);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.provider = token.provider as string | undefined;
        session.user.stravaAthleteId = token.stravaAthleteId as
          | string
          | undefined;
      }
      return session;
    },
  },
});
