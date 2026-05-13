import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

// Server-rendered sign-in page. Two buttons — Google and Strava — each
// posts to a tiny inline server action that calls Auth.js's signIn().
//
// The `?next=` query param lets us send users back to where they came
// from after signing in (e.g. clicking "Sign in to comment" on a blog
// post). Defaults to "/".
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const callbackUrl = next || "/";

  // Already signed in? Bounce to the destination.
  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  return (
    <main className="min-h-[100dvh] pt-28 pb-16 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg flex items-center justify-center">
      <div className="w-full max-w-[420px] bg-card border border-border rounded-2xl p-8 shadow-md">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-2 text-center">
          Cycling Hawaii
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2 text-center leading-tight">
          Sign in.
        </h1>
        <p className="text-mist text-sm italic text-center mb-8 max-w-[320px] mx-auto">
          We&apos;re not selling your data. We just want to know who&apos;s
          here.
        </p>

        <div className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-text text-bg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("strava", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-strava text-white font-semibold text-sm hover:bg-strava/90 transition-colors shadow-md shadow-strava/20"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              Continue with Strava
            </button>
          </form>
        </div>

        <p className="text-mist/70 text-xs italic mt-8 text-center">
          One account. Two ways in. Pick whichever you already trust.
        </p>
      </div>
    </main>
  );
}
