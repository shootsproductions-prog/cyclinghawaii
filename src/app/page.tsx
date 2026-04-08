import Hero from "@/components/Hero";
import About from "@/components/About";
import LiveTracker from "@/components/LiveTracker";
import InstagramGrid from "@/components/InstagramGrid";
import StravaRides from "@/components/StravaRides";
import Partners from "@/components/Partners";

export const revalidate = 3600; // ISR: regenerate every hour

export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <LiveTracker />
      <InstagramGrid />
      <StravaRides />
      <Partners />
    </main>
  );
}
