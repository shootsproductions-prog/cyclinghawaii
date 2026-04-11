import SectionHeader from "./SectionHeader";

export default function Partners() {
  return (
    <section id="partners" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="Get In Touch"
        title="Let's Connect"
        description="Vini answers every message. Eventually."
      />

      <div className="max-w-[680px] mx-auto text-center">
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-10 text-left">
          <p className="font-[family-name:var(--font-caveat)] text-text text-2xl md:text-[1.7rem] leading-snug">
            <span className="font-semibold">Laura here.</span>{" "}
            I&apos;m Vini&apos;s assistant, coach, moral support, and the one
            who remembers where he left his sunglasses. Send your message.
            I&apos;ll take notes, triage, and make sure it lands in his inbox.
            I&apos;m thorough. Occasionally to a fault. If you don&apos;t hear
            back within a day, it&apos;s because he&apos;s on the bike chasing
            another sunset and even I can&apos;t compete with a headwind.
          </p>
        </div>

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

        <p className="text-mist text-sm leading-relaxed mt-10 italic">
          Or skip the email and just meet him at the coffee shop. He&apos;ll
          be the guy in bibs ordering a second espresso and pretending
          he&apos;s about to leave.
        </p>
      </div>
    </section>
  );
}
