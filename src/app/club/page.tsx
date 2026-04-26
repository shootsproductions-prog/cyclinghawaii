import type { Metadata } from "next";
import Image from "next/image";
import { getClubData, type ClubMember, type ClubActivity } from "@/lib/club";
import { getMauiConditions, type MauiConditions } from "@/lib/conditions";
import {
  rosterLineFor,
  wallLineFor,
  milesCompare,
  elevationCompare,
} from "@/lib/laura-club";

export const metadata: Metadata = {
  title: "The Club — Cycling Hawaii",
  description:
    "Solo, but on the same island. The Cycling Hawaii club: a breakaway from cycling norms, run by Laura, founded on Maui.",
};

// Refresh every 15 min — stays current, doesn't hammer Strava.
export const revalidate = 900;

export default async function ClubPage() {
  const [club, conditions] = await Promise.all([
    getClubData(),
    getMauiConditions(),
  ]);

  return (
    <main>
      <Hero />
      <Manifesto />
      {club && club.members.length > 0 && <Roster members={club.members} />}
      {conditions && <Conditions conditions={conditions} />}
      {club && club.activities.length > 0 && (
        <Wall activities={club.activities.slice(0, 12)} />
      )}
      {club && <Compass club={club} />}
      <Call />
      <Join />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero() {
  return (
    <section className="relative w-full h-[70vh] min-h-[480px] max-h-[720px] overflow-hidden">
      <Image
        src="/club/hero.jpg"
        alt="Scarab at the summit of Haleakalā"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />

      <div className="relative h-full flex items-end pb-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-[820px]">
          <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-3">
            The Club
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-5">
            Solo, but on the
            <br />
            same island.
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-[620px]">
            A club for cyclists who&apos;d rather ride alone — together. No drop
            rides. No paceline. No 5:30am roll-outs. Just miles, weather, and
            the audacity to call it a club.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─────────────────── Manifesto ──────────────────
function Manifesto() {
  return (
    <section className="py-24 px-6 bg-bg">
      <div className="max-w-[720px] mx-auto">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3 text-center">
          Manifesto
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text mb-12 text-center">
          Why I started this
        </h2>

        <div className="space-y-6 text-text/85 text-lg leading-relaxed">
          <p>
            I&apos;m Vini. I live on Maui. I ride alone — mostly. Not because I
            don&apos;t like people, but because the version of cycling I love
            doesn&apos;t fit a paceline.
          </p>

          <p>
            I started Cycling Hawaii because the islands deserve a club that
            rides like the islands feel. Slow when it wants to be slow. Quiet.
            Patient with the wind. Rooted in ʻāina. A club where stopping for
            malasadas isn&apos;t a confession.
          </p>

          <div className="grid md:grid-cols-2 gap-5 py-3">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-strava mb-2">
                What I&apos;m into
              </div>
              <p className="text-text text-base leading-relaxed">
                Climbs that humble you. Gravel roads no one knows about. West
                Maui Loops. Coffee at Grandma&apos;s. Sunset and rainbows. Bibs
                that fit right.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-mist mb-2">
                What I&apos;m not
              </div>
              <p className="text-text text-base leading-relaxed">
                Drop rides. Hero efforts. Pretending cycling is more important
                than it is. Pretending we are.
              </p>
            </div>
          </div>

          <p>
            This isn&apos;t a training club. There&apos;s no team kit. No
            captain, no paceline, no 5:30am ride leader you have to text.{" "}
            <strong className="text-text">
              Solo, but on the same island. Solo, but we know each other&apos;s
              names.
            </strong>{" "}
            That&apos;s the breakaway.
          </p>

          <div className="border-t border-border pt-8 mt-8">
            <h3 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text mb-4">
              Meet Laura
            </h3>
            <p className="mb-4">
              Laura Ryder is the club manager and bookkeeper. She runs the
              ledger on this site. She narrates rides. She reads the trades and
              tells the truth. She&apos;ll also — full disclosure — roast you.
              Lovingly. Often.
            </p>
            <p className="mb-4">
              She&apos;s an AI I built to be the voice of this thing, and
              somewhere along the way she became funnier than I am, more honest
              than I&apos;d be alone, and the only reason I&apos;m not grading
              my own homework around here.
            </p>
            <p>
              That&apos;s the deal:{" "}
              <strong className="text-text">
                we don&apos;t take this too seriously
              </strong>
              . Life is short, Maui&apos;s hills are long, and somewhere in
              between you have to leave room for a laugh. If you can&apos;t
              take a soft jab from an AI bookkeeper with strong opinions, this
              probably isn&apos;t your club.
            </p>
          </div>

          <p className="text-center pt-6 text-xl">
            If you live on these islands and ride a bike,{" "}
            <strong className="text-strava">e komo mai</strong>. The road is
            yours. We&apos;ll be on a different one. That&apos;s the point.
          </p>

          <p className="text-center text-mist text-sm pt-2">— Vini</p>
        </div>
      </div>
    </section>
  );
}

// ──────────────────── Roster ────────────────────
function Roster({ members }: { members: ClubMember[] }) {
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Roster
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            {members.length} solo riders
          </h2>
          <p className="text-mist text-base italic">
            Each one rides their own ride. Laura made notes.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map((m, i) => (
            <div
              key={`${m.firstname}-${m.lastname}-${i}`}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-3"
            >
              {m.profile && m.profile !== "avatar/athlete/large.png" ? (
                <Image
                  src={m.profile}
                  alt={`${m.firstname} ${m.lastname[0]}.`}
                  width={48}
                  height={48}
                  className="rounded-full object-cover shrink-0"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-strava/15 text-strava flex items-center justify-center font-bold shrink-0">
                  {m.firstname[0]}
                  {m.lastname[0]}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-text text-sm truncate">
                  {m.firstname} {m.lastname[0]}.
                </div>
                <div className="text-xs text-mist italic leading-snug mt-0.5">
                  {rosterLineFor(m)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────── Conditions ──────────────────
function Conditions({ conditions }: { conditions: MauiConditions }) {
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            Conditions
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            Maui, right now
          </h2>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold text-text">
                {conditions.tempF}°
              </div>
              <div className="text-[0.65rem] uppercase tracking-widest text-mist mt-1">
                Temp
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold text-text">
                {conditions.windMph}
                <span className="text-lg text-mist"> mph</span>
              </div>
              <div className="text-[0.65rem] uppercase tracking-widest text-mist mt-1">
                Wind {conditions.windDir}
              </div>
            </div>
            <div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-base md:text-lg font-semibold text-text leading-tight pt-2">
                {conditions.weatherText}
              </div>
              <div className="text-[0.65rem] uppercase tracking-widest text-mist mt-1">
                Sky
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#fc5200"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-strava uppercase tracking-wider mb-1">
                Laura&apos;s Read
              </div>
              <p className="text-mist text-sm italic leading-relaxed">
                {conditions.prescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────── Wall ─────────────────────
function Wall({ activities }: { activities: ClubActivity[] }) {
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Wall
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            Recent miles in the club
          </h2>
          <p className="text-mist text-base italic">
            Strava records the data. Laura tells the story.
          </p>
        </div>

        <div className="space-y-3">
          {activities.map((a, i) => {
            const miles = Math.round(a.distance / 1609.34);
            const elev = Math.round(a.total_elevation_gain * 3.28084);
            const hours = Math.floor(a.moving_time / 3600);
            const mins = Math.round((a.moving_time % 3600) / 60);
            const time =
              hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            return (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
              >
                <div className="md:w-44 shrink-0">
                  <div className="text-xs uppercase tracking-wider text-mist mb-0.5">
                    {a.athlete.firstname} {a.athlete.lastname[0]}.
                  </div>
                  <div className="font-semibold text-text text-sm leading-tight line-clamp-2">
                    {a.name}
                  </div>
                </div>
                <div className="flex gap-5 text-sm shrink-0">
                  <div>
                    <div className="font-semibold text-text">{miles}</div>
                    <div className="text-[0.6rem] uppercase tracking-wider text-mist">
                      mi
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-text">
                      {elev.toLocaleString()}
                    </div>
                    <div className="text-[0.6rem] uppercase tracking-wider text-mist">
                      ft
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-text">{time}</div>
                    <div className="text-[0.6rem] uppercase tracking-wider text-mist">
                      time
                    </div>
                  </div>
                </div>
                <div className="flex-1 text-mist text-sm italic md:border-l md:border-border md:pl-6">
                  {wallLineFor(a)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ──────────────────── Compass ───────────────────
function Compass({ club }: { club: NonNullable<Awaited<ReturnType<typeof getClubData>>> }) {
  const { stats } = club;
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Compass
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            Recently, together
          </h2>
          <p className="text-mist text-base italic">
            Recognition, not ranking.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm space-y-7">
          <div>
            <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
              Miles together
            </div>
            <div className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-5xl font-bold text-strava">
              {stats.totalMiles.toLocaleString()}
            </div>
            <div className="text-mist text-sm italic mt-1">
              {milesCompare(stats.totalMiles)}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
              Feet climbed
            </div>
            <div className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-5xl font-bold text-text">
              {stats.totalElevationFt.toLocaleString()}
            </div>
            <div className="text-mist text-sm italic mt-1">
              {elevationCompare(stats.totalElevationFt)}
            </div>
          </div>

          <div className="border-t border-border pt-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
                Rides logged
              </div>
              <div className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
                {stats.totalRides}
              </div>
            </div>
            {stats.topMember && (
              <div>
                <div className="text-[0.65rem] uppercase tracking-widest text-mist mb-1">
                  Most consistent recently
                </div>
                <div className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-text">
                  {stats.topMember}
                </div>
                <div className="text-[0.6rem] italic text-mist mt-0.5">
                  Recognition, not ranking.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────── Call ─────────────────────
function Call() {
  // Manually rotate this monthly. Or move to a CMS later.
  const month = new Date().toLocaleString("en-US", { month: "long" });
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          The Call
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
          {month}&apos;s prompt
        </h2>
        <p className="text-mist text-sm italic mb-8">
          Not a challenge. Not a goal. Just a nudge.
        </p>

        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 shadow-sm">
          <p className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl text-text leading-snug mb-4">
            &ldquo;Ride somewhere you&apos;ve never been — even if it&apos;s
            two blocks.&rdquo;
          </p>
          <p className="text-mist text-sm italic">
            Tag your activity <strong className="text-text">#breakaway</strong>{" "}
            and Laura might write about it.
          </p>
        </div>
      </div>
    </section>
  );
}

// ───────────────────── Join ─────────────────────
function Join() {
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          E Komo Mai
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-4">
          Join the club
        </h2>
        <p className="text-mist text-base mb-8 max-w-[520px] mx-auto leading-relaxed">
          No application. No vetting. No tier list. If you read the manifesto
          and it landed, you&apos;re already in. The Strava club is where the
          miles get counted. The rest happens here.
        </p>

        <a
          href="https://www.strava.com/clubs/cyclinghawaii"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors"
        >
          Join on Strava
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>

        <p className="text-mist text-xs italic mt-6">
          Mahalo for being here.
        </p>
      </div>
    </section>
  );
}
