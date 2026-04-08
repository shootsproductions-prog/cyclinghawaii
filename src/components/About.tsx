import SectionHeader from "./SectionHeader";

export default function About() {
  return (
    <section id="about" className="py-24 px-8 bg-volcanic">
      <SectionHeader
        label="The Journey"
        title="About This Ride"
        description="One cyclist. Four islands. Endless roads."
      />

      <div className="max-w-[1100px] mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <div>
          <p className="text-mist text-base leading-relaxed mb-6">
            Cycling Hawaii is a personal project documenting my journey
            exploring the Hawaiian Islands by bicycle. From the 10,000-foot
            volcanic summit of Haleakala to the lush coastal roads of Kauai,
            every ride tells a story.
          </p>
          <p className="text-mist text-base leading-relaxed mb-6">
            This site automatically tracks my rides through Strava, shares
            moments from the road via Instagram, and offers live GPS tracking
            when I&apos;m out on the bike. It&apos;s part ride journal, part
            route guide, and part love letter to these islands.
          </p>
          <p className="text-mist text-base leading-relaxed">
            My goal is simple: inspire more people to experience Hawaii from the
            saddle. There&apos;s no better way to feel the warmth of the
            islands, smell the plumeria on the wind, and earn the descents.
          </p>
        </div>

        {/* Placeholder image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-basalt border border-white/5">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1a1a1a 0%, #3d2000 50%, #1a1a1a 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg
                width="64"
                height="64"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="mx-auto mb-3 text-white/20"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-sm text-white/30">Your photo here</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
