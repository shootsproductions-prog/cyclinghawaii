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
    <section id="partners" className="py-24 px-8 bg-volcanic">
      <SectionHeader
        label="Partners"
        title="Ride With Us"
        description="Interested in reaching an engaged audience of cyclists and adventure travelers?"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-[900px] mx-auto mb-12">
        {placeholders.map((name) => (
          <div
            key={name}
            className="flex items-center justify-center h-28 rounded-xl border border-dashed border-white/10 bg-basalt/50 transition-all hover:border-brand/30 hover:bg-basalt"
          >
            <span className="text-sm text-mist/60 font-medium">{name}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-mist text-sm mb-6 max-w-md mx-auto">
          We partner with brands that share our passion for cycling and the
          Hawaiian Islands. Reach out to discuss sponsorship opportunities.
        </p>
        <a
          href="mailto:hello@cyclinghawaii.com"
          className="inline-flex items-center gap-2 px-6 py-3 border border-brand/40 text-brand font-semibold text-sm rounded-lg transition-all hover:bg-brand/10 hover:border-brand/60"
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
          Partner With Us
        </a>
      </div>
    </section>
  );
}
