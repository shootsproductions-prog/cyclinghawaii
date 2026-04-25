import Image from "next/image";

export default function Welcome() {
  return (
    <section
      id="welcome"
      className="relative w-full h-[55vh] min-h-[420px] max-h-[640px] overflow-hidden"
    >
      {/* Photo */}
      <Image
        src="/hero/welcome.jpg"
        alt="Vini riding through Maui's back roads"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Left-weighted gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

      {/* Bottom fade so the page bleeds into the next section */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />

      {/* Copy */}
      <div className="relative h-full flex items-center px-6 md:px-12 lg:px-20">
        <div className="max-w-[640px]">
          <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
            Welcome
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-5">
            Cycling
            <br />
            Hawaii
          </h1>
          <p className="text-white/85 text-base md:text-lg leading-relaxed italic max-w-[520px]">
            Vini&apos;s personal cycling shrine. I&apos;m Laura — I run the
            books, the blog, and the reality checks. He rides. I&apos;m here so
            he doesn&apos;t grade his own homework.
          </p>
          <div className="mt-5 text-xs text-white/60 tracking-wider uppercase">
            — Laura Ryder, Chief Reality Officer
          </div>
        </div>
      </div>
    </section>
  );
}
