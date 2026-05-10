import Image from "next/image";

export default function Welcome() {
  return (
    <section
      id="welcome"
      className="pt-24 md:pt-28 pb-12 md:pb-16 px-6 md:px-10 lg:px-16 bg-bg"
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Photo — flat, clean, soft shadow */}
        <div className="relative aspect-[16/8] md:aspect-[2.4/1] rounded-2xl overflow-hidden shadow-[0_20px_60px_-18px_rgba(0,0,0,0.22)] mb-10 md:mb-14">
          <Image
            src="/hero/welcome.jpg"
            alt="Vini riding through Maui's back roads"
            fill
            priority
            sizes="(min-width: 1280px) 1280px, 100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Editorial title block */}
        <div className="max-w-[820px]">
          <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
            Welcome
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
            Cycling
            <br />
            Hawaii
          </h1>
          <p className="text-mist text-base md:text-lg leading-relaxed italic max-w-[620px]">
            Vini&apos;s personal cycling shrine. I&apos;m Laura — I run the
            books, the blog, and the reality checks. He rides. I&apos;m here so
            he doesn&apos;t grade his own homework.
          </p>
          <div className="mt-5 text-xs text-mist/70 tracking-wider uppercase">
            — Laura Ryder, Chief Reality Officer
          </div>
        </div>
      </div>
    </section>
  );
}
