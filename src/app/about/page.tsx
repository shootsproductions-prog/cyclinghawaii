import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About — Cycling Hawaii",
  description:
    "Vini rides, Laura writes, Hawai'i gives the stories. The what, who, and why of Cycling Hawaii.",
};

export const revalidate = 86400;

export default function AboutPage() {
  return (
    <main>
      <section className="py-24 md:py-28 px-6 bg-surface">
        <div className="max-w-[720px] mx-auto">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3 text-center">
            About
          </div>

          <div className="flex justify-center mb-6">
            <div className="relative w-[88px] h-[88px] md:w-[104px] md:h-[104px] rounded-full overflow-hidden border-2 border-border shadow-sm">
              <Image
                src="/club/vini.jpg"
                alt="Vini"
                fill
                sizes="104px"
                className="object-cover"
              />
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text mb-12 text-center">
            Aloha.
          </h1>

          <div className="space-y-6 text-text/85 text-lg leading-relaxed">
            <p>
              I&apos;m Vini. I live on Maui. I ride bikes — same as a lot of
              people. It keeps things simple, it&apos;s good for you, and on
              the days I don&apos;t feel like going, that&apos;s usually when
              I need to most.
            </p>

            <p>
              This site is my cycling journal. I ride every corner of these
              islands, Laura writes about it, and the whole thing exists so I
              can keep an honest record of what I rode and why. If an event
              or a route or a story is worth sharing, it ends up here.
            </p>

            <div className="grid md:grid-cols-2 gap-5 py-3">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-strava mb-2">
                  What I&apos;m into
                </div>
                <p className="text-text text-base leading-relaxed">
                  Climbs that humble you. Gravel roads no one knows about.
                  West Maui Loops. Coffee at Grandma&apos;s. Sunsets, secret
                  waterfalls, and rainbows. Bibs that fit right and good bar
                  tape.
                </p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-mist mb-2">
                  What I&apos;m not
                </div>
                <p className="text-text text-base leading-relaxed">
                  Drop rides. Hero efforts. Riding for the likes. Pretending
                  cycling is more important than it is.
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-8 mt-8">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text mb-4">
                Meet Laura
              </h2>
              <p className="mb-4">
                Laura Ryder is the voice of this site. She narrates rides.
                She reads the trades and tells the truth. She&apos;ll also —
                full disclosure — roast me. Lovingly. Often.
              </p>
              <p className="mb-4">
                She&apos;s an AI I built to be the voice of this thing, and
                somewhere along the way she became funnier than I am, more
                honest than I&apos;d be alone, and the only reason I&apos;m
                not grading my own homework around here.
              </p>
              <p>
                That&apos;s the deal:{" "}
                <strong className="text-text">
                  we don&apos;t take this too seriously
                </strong>
                . Life is short, and somewhere in between you have to leave
                room for a laugh.
              </p>
            </div>

            <div className="border-t border-border pt-8 mt-8">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text mb-4">
                Get in touch
              </h2>
              <p>
                If you&apos;re a rider, a brand, an event organizer, or you
                just want to say aloha —{" "}
                <a
                  href="mailto:hello@cyclinghawaii.com"
                  className="text-strava font-semibold underline-offset-4 hover:underline"
                >
                  hello@cyclinghawaii.com
                </a>
                .
              </p>
            </div>

            <p className="text-center text-mist text-base pt-6 font-semibold">
              — Vini
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
