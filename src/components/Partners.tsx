import SectionHeader from "./SectionHeader";

export default function Partners() {
  return (
    <section id="partners" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="Get In Touch"
        title="Let's Connect"
        description="Questions, collaborations, or just a good route recommendation — Vini answers all of them."
      />

      <div className="max-w-[680px] mx-auto text-center">
        <p className="text-mist text-base leading-relaxed mb-8">
          If your brand rides with cyclists who actually ride, there&apos;s
          space here for you. Sponsorships, product placements, content
          collaborations — all welcome.
        </p>
        <p className="text-mist text-sm leading-relaxed mb-10 italic">
          Or skip the email and just meet him at the coffee shop. He&apos;ll
          be the guy in bibs ordering a second espresso and pretending
          he&apos;s about to leave.
        </p>

        <a
          href="mailto:vini@cyclinghawaii.com"
          className="inline-flex items-center gap-2 px-8 py-4 bg-strava text-white font-semibold text-sm rounded-lg transition-all hover:bg-brand hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Let&apos;s Connect
        </a>
        <p className="text-mist text-xs mt-4 font-mono">
          vini@cyclinghawaii.com
        </p>
      </div>
    </section>
  );
}
