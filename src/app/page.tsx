import { getStravaData } from "@/lib/strava";
import { generateBlogEntries } from "@/lib/blog";
import { getChallenge } from "@/lib/challenge";
import { checkAndAwardBadge } from "@/lib/badges";
import FeaturedRide from "@/components/FeaturedRide";
import StravaFeed from "@/components/StravaFeed";
import Challenge from "@/components/Challenge";
import LiveTracker from "@/components/LiveTracker";
import InstagramGrid from "@/components/InstagramGrid";
import LogFiles from "@/components/LogFiles";
import YouTubePlaylist from "@/components/YouTubePlaylist";
import Partners from "@/components/Partners";
import Divider from "@/components/Divider";

export const revalidate = 3600;

export default async function Home() {
  const { featured, rides, stats, monthlyStats } = await getStravaData();
  const [blogEntries, challenge] = await Promise.all([
    generateBlogEntries(featured, rides),
    getChallenge(monthlyStats),
  ]);
  const badges = await checkAndAwardBadge(challenge);

  return (
    <main>
      <FeaturedRide ride={featured} />
      <Divider />
      <StravaFeed rides={rides} stats={stats} />
      <Divider />
      <Challenge challenge={challenge} badges={badges} />
      <Divider />
      <LiveTracker />
      <Divider />
      <InstagramGrid />
      <Divider />
      <LogFiles entries={blogEntries.slice(0, 3)} showArchiveLink />
      <Divider />
      <YouTubePlaylist />
      <Divider />
      <Partners />
    </main>
  );
}
