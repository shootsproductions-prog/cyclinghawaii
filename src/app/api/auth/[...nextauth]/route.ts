// Auth.js v5 route handler — exposes /api/auth/signin, /api/auth/signout,
// /api/auth/session, /api/auth/callback/google, /api/auth/callback/strava,
// /api/auth/csrf, etc.
//
// The existing rider OAuth routes at /api/auth/strava/start and
// /api/auth/strava/callback are static paths and take precedence over
// this catch-all — they keep working unchanged.
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
