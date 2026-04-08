import Hero from "@/components/Hero";
import About from "@/components/About";
import StravaRides from "@/components/StravaRides";
import LiveTracker from "@/components/LiveTracker";
import InstagramGrid from "@/components/InstagramGrid";
import Partners from "@/components/Partners";
import FadeIn from "@/components/FadeIn";
import Divider from "@/components/Divider";

export const revalidate = 3600;

export default function Home() {
  return (
    <main>
      <Hero />
      <FadeIn>
        <About />
      </FadeIn>
      <Divider />
      <FadeIn>
        <StravaRides />
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
        <Partners />
      </FadeIn>
    </main>
  );
}
