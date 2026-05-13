// Augment Auth.js types with platform-specific session fields so they
// are typed wherever we call useSession() / auth().
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
      stravaAthleteId?: string;
      stravaPremium?: boolean;
    };
  }
}
