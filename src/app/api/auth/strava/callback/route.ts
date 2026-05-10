import { NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  isInCyclingHawaiiClub,
} from "@/lib/strava-user";
import {
  saveRider,
  generateSlug,
  type Rider,
} from "@/lib/rider-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const origin = url.origin;

  if (error || !code) {
    return NextResponse.redirect(
      `${origin}/roast?error=${error ?? "no_code"}`
    );
  }

  try {
    // 1. Exchange the auth code for tokens + athlete data
    const tokenRes = await exchangeCodeForTokens(code);
    const athlete = tokenRes.athlete;

    // 2. Verify they're a member of the Cycling Hawaii Strava club
    const isMember = await isInCyclingHawaiiClub(tokenRes.access_token);
    if (!isMember) {
      return NextResponse.redirect(`${origin}/roast?error=not_member`);
    }

    // 3. Generate a slug + persist the rider
    const slug = await generateSlug(
      athlete.firstname,
      athlete.lastname,
      athlete.id
    );

    const rider: Rider = {
      athleteId: athlete.id,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      profile: athlete.profile,
      city: athlete.city,
      state: athlete.state,
      slug,
      accessToken: tokenRes.access_token,
      refreshToken: tokenRes.refresh_token,
      tokenExpiresAt: tokenRes.expires_at,
      createdAt: Date.now(),
    };

    await saveRider(rider);

    // 4. Redirect to their fresh profile page
    return NextResponse.redirect(`${origin}/${slug}?welcome=1`);
  } catch (err) {
    console.error("Strava OAuth callback error:", err);
    return NextResponse.redirect(`${origin}/roast?error=oauth_failed`);
  }
}
