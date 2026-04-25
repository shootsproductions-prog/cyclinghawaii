import { getStravaData } from "@/lib/strava";
import { generateBlogEntries } from "@/lib/blog";
import { getChallenge } from "@/lib/challenge";
import { finalizeMonthlyBadge, loadBadges } from "@/lib/badges";
import { awardBonusBadges } from "@/lib/bonus-badges";
import FeaturedRide from "@/components/FeaturedRide";
import Scarab from "@/components/Scarab";
import StravaFeed from "@/components/StravaFeed";
import Challenge from "@/components/Challenge";
import LiveTracker from "@/components/LiveTracker";
import InstagramGrid from "@/components/InstagramGrid";
import LogFiles from "@/components/LogFiles";
import YouTubePlaylist from "@/components/YouTubePlaylist";
import SpotifyPlaylist from "@/components/SpotifyPlaylist";
import Partners from "@/components/Partners";
import Divider from "@/components/Divider";

// Revalidate every 15 min so new rides (and Laura's fresh roasts) show up fast
export const revalidate = 900;

export default async function Home() {
  const { featured, rides, stats, monthlyStats, bike, rawActivities } =
    await getStravaData();
  const [blogEntries, challenge] = await Promise.all([
    generateBlogEntries(featured, rides),
    getChallenge(monthlyStats),
  ]);
  // Award the badge if the current challenge has been completed.
  // (Past months are auto-finalized inside getChallenge when transitioning.)
  await finalizeMonthlyBadge(challenge);
  const [badges, bonusBadges] = await Promise.all([
    loadBadges(),
    awardBonusBadges(rawActivities, stats),
  ]);

  // Find the blog entry for the currently featured ride (for Laura's Take)
  const featuredEntry = blogEntries.find((e) => e.rideId === featured.id);

  return (
    <main>
      <FeaturedRide ride={featured} featuredEntry={featuredEntry} />
      <Divider />
      <StravaFeed rides={rides} stats={stats} />
      <Divider />
      <LiveTracker />
      <Divider />
      <Challenge challenge={challenge} badges={badges} bonusBadges={bonusBadges} />
      <Divider />
      <LogFiles entries={blogEntries.slice(0, 3)} showArchiveLink />
      <Divider />
      <Scarab bike={bike} />
      <Divider />
      <InstagramGrid />
      <Divider />
      <YouTubePlaylist />
      <Divider />
      <SpotifyPlaylist />
      <Divider />
      <Partners />
    </main>
  );
}
