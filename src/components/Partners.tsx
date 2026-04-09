import SectionHeader from "./SectionHeader";

const placeholders = [
  "Bike Brand",
  "Nutrition",
  "Apparel",
  "Components",
  "Tourism",
  "Tech",
];

export default function Partners() {
  return (
    <section id="partners" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="Partners"
        title="Ride With Us"
        description="Your brand in front of cyclists who actually ride. Not just scroll."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-[900px] mx-auto mb-12">
        {placeholders.map((name) => (
          <div
            key={name}
            className="flex items-center justify-center h-28 rounded-xl border border-dashed border-border bg-card transition-all hover:border-brand/40 hover:shadow-sm"
          >
            <span className="text-sm text-mist/50 font-medium">{name}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-mist text-sm mb-2 max-w-lg mx-auto">
          Cycling Hawaii reaches an engaged audience of endurance athletes,
          adventure travelers, and people who think &quot;flat&quot; is a four-letter word.
        </p>
        <p className="text-mist text-xs mb-6">
          Sponsorships &middot; Product placement &middot; Content collaborations
        </p>
        <a
          href="mailto:vini@cyclinghawaii.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-strava text-white font-semibold text-sm rounded-lg transition-all hover:bg-brand hover:shadow-lg"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Let&apos;s Talk
        </a>
        <p className="text-mist text-xs mt-3">vini@cyclinghawaii.com</p>
      </div>
    </section>
  );
}
