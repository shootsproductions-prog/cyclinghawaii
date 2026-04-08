import SectionHeader from "./SectionHeader";

export default function LiveTracker() {
  return (
    <section id="tracker" className="py-20 px-6">
      <SectionHeader
        label="Live Tracker"
        title="Follow the Ride"
        description="Real-time GPS tracking powered by Cadence. Watch riders navigate the islands live."
      />

      <div className="max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-border shadow-lg bg-card">
        <div className="flex items-center gap-3 px-5 py-3 bg-surface border-b border-border">
          <div className="relative w-2 h-2 rounded-full bg-[#ff5f57] shadow-[18px_0_0_#febc2e,36px_0_0_#28c840]" />
          <div className="flex-1 text-center text-xs text-mist font-mono">
            livetracker.getcadence.app
          </div>
        </div>

        <iframe
          src="https://livetracker.getcadence.app/RWQ6D5938lyBfy"
          title="Cycling Hawaii Live Tracker"
          loading="lazy"
          allow="geolocation"
          className="w-full h-[600px] max-md:h-[400px] border-none block"
        />
      </div>
    </section>
  );
}
