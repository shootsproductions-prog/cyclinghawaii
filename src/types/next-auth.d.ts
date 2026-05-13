// Augment Auth.js types so `session.user.provider` and
// `session.user.stravaAthleteId` are typed in components and route handlers.
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
      stravaAthleteId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    stravaAthleteId?: string;
  }
}
