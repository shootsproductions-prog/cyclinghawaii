import { getStravaData } from "@/lib/strava";
import FeaturedRide from "@/components/FeaturedRide";
import StravaFeed from "@/components/StravaFeed";
import LiveTracker from "@/components/LiveTracker";
import InstagramGrid from "@/components/InstagramGrid";
import YouTubePlaylist from "@/components/YouTubePlaylist";
import Partners from "@/components/Partners";
import FadeIn from "@/components/FadeIn";
import Divider from "@/components/Divider";

export const revalidate = 3600;

export default async function Home() {
  const { featured, rides, stats } = await getStravaData();

  return (
    <main>
      <FeaturedRide ride={featured} />
      <Divider />
      <FadeIn>
        <StravaFeed rides={rides} stats={stats} />
      </FadeIn>
      <Divider />
      <FadeIn>
        <LiveTracker />
      </FadeIn>
      <Divider />
      <FadeIn>
        <InstagramGrid />
      </FadeIn>
      <Divider />
      <FadeIn>
        <YouTubePlaylist />
      </FadeIn>
      <Divider />
      <FadeIn>
        <Partners />
      </FadeIn>
    </main>
  );
}
