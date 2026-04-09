import { getStravaData } from "@/lib/strava";
import { generateBlogEntries } from "@/lib/blog";
import FeaturedRide from "@/components/FeaturedRide";
import StravaFeed from "@/components/StravaFeed";
import LiveTracker from "@/components/LiveTracker";
import InstagramGrid from "@/components/InstagramGrid";
import YouTubePlaylist from "@/components/YouTubePlaylist";
import LogFiles from "@/components/LogFiles";
import Partners from "@/components/Partners";
import Divider from "@/components/Divider";

export const revalidate = 3600;

export default async function Home() {
  const { featured, rides, stats } = await getStravaData();
  const blogEntries = await generateBlogEntries(featured, rides);

  return (
    <main>
      <FeaturedRide ride={featured} />
      <Divider />
      <StravaFeed rides={rides} stats={stats} />
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
