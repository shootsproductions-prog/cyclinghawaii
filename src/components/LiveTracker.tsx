import SectionHeader from "./SectionHeader";

export default function LiveTracker() {
  return (
    <section
      id="tracker"
      className="py-24 px-8"
      style={{
        background:
          "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
      }}
    >
      <SectionHeader
        label="Live Tracker"
        title="Follow the Ride"
        description="Real-time GPS tracking powered by Cadence. Watch riders navigate the islands live."
      />

      <div className="max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_0_80px_rgba(217,119,6,0.06)] bg-basalt">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 px-5 py-3 bg-volcanic border-b border-white/5">
          <div className="relative w-2 h-2 rounded-full bg-[#ff5f57] after:absolute after:content-[''] shadow-[18px_0_0_#febc2e,36px_0_0_#28c840]" />
          <div className="flex-1 text-center text-xs text-ash font-mono">
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
