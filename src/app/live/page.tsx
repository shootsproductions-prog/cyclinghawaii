import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Tracker — Cycling Hawaii",
  description:
    "Real-time GPS tracking for Vini's current ride. Powered by Cadence.",
};

// No revalidation — the iframe handles its own live updates.
export const dynamic = "force-static";

export default function LivePage() {
  return (
    <main className="fixed inset-0 w-screen h-[100dvh] bg-bg overflow-hidden z-[100]">
      <iframe
        src="https://livetracker.getcadence.app/RWQ6D5938lyBfy"
        title="Cycling Hawaii — Live Tracker"
        allow="geolocation; fullscreen"
        className="w-full h-full border-none block"
      />
    </main>
  );
}
