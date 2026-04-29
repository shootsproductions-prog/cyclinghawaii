import type { Metadata } from "next";
import Image from "next/image";
import {
  getClubData,
  type ClubMember,
  type ClubActivity,
  type ClubData,
} from "@/lib/club";
import { getMauiConditions, type MauiConditions } from "@/lib/conditions";
import {
  rosterLinesFor,
  safeInitial,
  wallLineFor,
  isTagged,
  sportTypeColor,
  milesCompare,
  elevationCompare,
} from "@/lib/laura-club";
import { assignRoles } from "@/lib/peloton-roles";

export const metadata: Metadata = {
  title: "The Club — Cycling Hawaii",
  description:
    "A cycling club that doesn't take itself too seriously. Laura runs the books, the wall, and the roasts. Founded on Maui.",
};

export const revalidate = 900;

const ROSTER_CAP = 12;
const STRAVA_CLUB_URL = "https://www.strava.com/clubs/cyclinghawaii";

export default async function ClubPage() {
  const [club, conditions] = await Promise.all([
    getClubData(),
    getMauiConditions(),
  ]);

  // Sort wall: tagged rides first, then by recency (already ordered by Strava).
  const wall = club
    ? [...club.activities].sort(
        (a, b) => Number(isTagged(b)) - Number(isTagged(a))
      )
    : [];

  // Top 12 roster: members with rides in the recent feed, ranked by miles.
  const roster = club ? buildRoster(club, ROSTER_CAP) : [];

  // Avatar lookup map: "First L." → profile URL
  const avatarMap = new Map<string, string>();
  if (club) {
    for (const m of club.members) {
      const key = `${m.firstname} ${m.lastname[0]}.`;
      if (m.profile && m.profile !== "avatar/athlete/large.png") {
        avatarMap.set(key, m.profile);
      }
    }
  }

  return (
    <main>
      <Hero />

      {wall.length > 0 && (
        <Wall activities={wall.slice(0, 3)} avatarMap={avatarMap} />
      )}

      {roster.length > 0 && club && (
        <Roster members={roster} activities={club.activities} />
      )}

      {conditions && <Conditions conditions={conditions} />}

      {club && <Compass club={club} />}

      <Call />

      <Join variant="primary" />

      <Manifesto />

      <Join variant="secondary" />
    </main>
  );
}

// ─── helper: rank members for the Roster ─────────────────────────────
function buildRoster(club: ClubData, cap: number): ClubMember[] {
  // Tally miles per "First L." key from recent activities
  const milesByKey = new Map<string, number>();
  for (const a of club.activities) {
    if (a.type !== "Ride" && a.sport_type !== "Ride" && a.sport_type !== "GravelRide" && a.sport_type !== "MountainBikeRide") continue;
    const key = `${a.athlete.firstname} ${a.athlete.lastname[0]}.`;
    milesByKey.set(key, (milesByKey.get(key) ?? 0) + a.distance / 1609.34);
  }

  // Active = members who appear in recent activities, sorted by miles desc
  const active: ClubMember[] = [];
  const inactive: ClubMember[] = [];
  for (const m of club.members) {
    const key = `${m.firstname} ${m.lastname[0]}.`;
    if (milesByKey.has(key)) active.push(m);
    else inactive.push(m);
  }
  active.sort((a, b) => {
    const ka = `${a.firstname} ${a.lastname[0]}.`;
    const kb = `${b.firstname} ${b.lastname[0]}.`;
    return (milesByKey.get(kb) ?? 0) - (milesByKey.get(ka) ?? 0);
  });

  // Take active first, fill remainder with inactive (newest joins first by API order)
  const ranked = [...active, ...inactive];
  return ranked.slice(0, cap);
}

// ───────────────────── Hero ─────────────────────
function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          The Club
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text leading-[0.95] mb-6">
          Just<span className="text-strava"> Ride.</span>
        </h1>
        <p className="text-mist text-lg md:text-xl max-w-[640px] mx-auto leading-relaxed">
          Miles, weather, and the guts to call it a club. Laura runs the
          books, the wall, and the roasts. Aloha vibes only.
        </p>
      </div>
    </section>
  );
}

// ───────────────────── Wall ─────────────────────
function Wall({
  activities,
  avatarMap,
}: {
  activities: ClubActivity[];
  avatarMap: Map<string, string>;
}) {
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Wall
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            Recent rides in the club
          </h2>
          <p className="text-mist text-base italic">
            Strava records the data. Laura tells the story.
          </p>
        </div>

        <div className="space-y-4">
          {activities.map((a, i) => (
            <WallCard key={i} activity={a} avatarMap={avatarMap} />
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href={STRAVA_CLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-strava hover:text-strava/80 transition-colors uppercase tracking-wider"
          >
            More on Strava
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
        </div>
      </div>
    </section>
  );
}

function WallCard({
  activity,
  avatarMap,
}: {
  activity: ClubActivity;
  avatarMap: Map<string, string>;
}) {
  const a = activity;
  const tagged = isTagged(a);
  const miles = Math.round(a.distance / 1609.34);
  const elev = Math.round(a.total_elevation_gain * 3.28084);
  const hours = a.moving_time / 3600;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const time = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const avgSpeed = hours > 0 ? Math.round((miles / hours) * 10) / 10 : 0;
  const sport = sportTypeColor(a.sport_type, a.type);
  const avatarKey = `${a.athlete.firstname} ${a.athlete.lastname[0]}.`;
  const avatar = avatarMap.get(avatarKey);

  return (
    <div
      className={`bg-card border rounded-xl p-5 transition-shadow hover:shadow-md relative overflow-hidden ${
        tagged ? "border-strava/40 shadow-md" : "border-border"
      }`}
    >
      {/* Colored accent stripe on the left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          tagged ? "bg-strava" : sport.bg.replace("/15", "")
        }`}
      />

      <div className="flex items-start gap-4 pl-2">
        {/* Avatar */}
        {avatar ? (
          <Image
            src={avatar}
            alt={avatarKey}
            width={48}
            height={48}
            className="rounded-full object-cover shrink-0"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-strava/15 text-strava flex items-center justify-center font-bold shrink-0 text-sm">
            {safeInitial(a.athlete.firstname)}
            {safeInitial(a.athlete.lastname)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs uppercase tracking-wider text-mist font-semibold">
              {a.athlete.firstname} {a.athlete.lastname[0]}.
            </span>
            <span
              className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${sport.bg} ${sport.text}`}
            >
              {sport.label}
            </span>
            {tagged && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-strava text-white">
                🤙 Tagged
              </span>
            )}
          </div>

          {/* Ride name */}
          <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base md:text-lg leading-tight mb-3">
            {a.name}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 text-sm mb-3">
            <Stat label="mi" value={miles.toLocaleString()} />
            <Stat label="ft" value={elev.toLocaleString()} />
            <Stat label="time" value={time} />
            <Stat label="mph" value={avgSpeed > 0 ? avgSpeed.toString() : "—"} />
          </div>

          {/* Laura's line */}
          <div className="text-mist text-sm italic border-t border-border pt-3">
            {wallLineFor(a)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-text font-[family-name:var(--font-space-grotesk)]">
        {value}
      </div>
      <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-0.5">
        {label}
      </div>
    </div>
  );
}

// ──────────────────── Roster ────────────────────
function Roster({
  members,
  activities,
}: {
  members: ClubMember[];
  activities: ClubActivity[];
}) {
  const lines = rosterLinesFor(members);
  const roles = assignRoles(members, activities);

  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Roster
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            The Twelve
          </h2>
          <p className="text-mist text-base italic max-w-[560px] mx-auto">
            Twelve riders. Twelve roles. Updated daily by Laura. Ride to keep
            your spot.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m, i) => {
            const key = `${m.firstname} ${m.lastname}`;
            const memberKey = `${m.firstname} ${m.lastname[0]}.`;
            const initials = `${safeInitial(m.firstname)}${safeInitial(
              m.lastname
            )}`;
            const role = roles.get(memberKey);
            return (
              <div
                key={`${m.firstname}-${m.lastname}-${i}`}
                className="bg-card rounded-xl border border-border p-5 flex items-start gap-3"
              >
                {m.profile && m.profile !== "avatar/athlete/large.png" ? (
                  <Image
                    src={m.profile}
                    alt={memberKey}
                    width={56}
                    height={56}
                    className="rounded-full object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-strava/15 text-strava flex items-center justify-center font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text text-sm truncate">
                    {m.firstname} {m.lastname[0]}.
                  </div>
                  {role && (
                    <div className="inline-block text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-strava/10 text-strava mt-1.5 mb-1">
                      {role.role}
                    </div>
                  )}
                  <div className="text-xs text-mist italic leading-snug mt-1">
                    {role?.blurb ?? lines.get(key) ?? ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ────────────────── Conditions ──────────────────
function Conditions({ conditions }: { conditions: MauiConditions }) {
  return (
    <section className="py-20 px-6 bg-surface">
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

// ──────────────────── Compass ───────────────────
function Compass({ club }: { club: ClubData }) {
  const { stats } = club;
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Compass
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
            Recently, together
          </h2>
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
          <p className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl text-text leading-snug mb-5">
            &ldquo;Ride somewhere you&apos;ve never been — even if it&apos;s
            two blocks.&rdquo;
          </p>
          <div className="border-t border-border pt-5">
            <p className="text-mist text-sm leading-relaxed">
              Tag your ride{" "}
              <strong className="text-strava">#cyclinghawaii</strong> and
              you&apos;ll show up on The Wall with a custom Laura roast.
              That&apos;s the deal. Tag, ride, get roasted, repeat.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────── Join ─────────────────────
function Join({ variant }: { variant: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <section className="pb-20 px-6 bg-bg">
        <div className="max-w-[700px] mx-auto text-center border-t border-border pt-12">
          <p className="text-mist text-sm italic mb-5">Still here? Good.</p>
          <a
            href={STRAVA_CLUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border text-text font-semibold text-sm uppercase tracking-wider hover:border-strava hover:text-strava transition-colors"
          >
            Join the Club on Strava
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
          No application. No vetting. No tier list. The Strava club is where
          the miles get counted. The rest happens here.
        </p>

        <a
          href={STRAVA_CLUB_URL}
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
      </div>
    </section>
  );
}

// ─────────────────── Manifesto ──────────────────
function Manifesto() {
  return (
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-[720px] mx-auto">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3 text-center">
          Manifesto
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

        <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text mb-12 text-center">
          Aloha.
        </h2>

        <div className="space-y-6 text-text/85 text-lg leading-relaxed">
          <p>
            I&apos;m Vini. I live on Maui. I ride bikes — same as a lot of
            people. It keeps things simple, it&apos;s good for you, and on the
            days I don&apos;t feel like going, that&apos;s usually when I need
            to most.
          </p>

          <p>
            I started Cycling Hawaii as a platform for riders — a place to
            ride, celebrate each other, roast each other, and have fun. Show
            up. Give what you&apos;ve got. That&apos;s the whole pitch.
          </p>

          <div className="grid md:grid-cols-2 gap-5 py-3">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-strava mb-2">
                What I&apos;m into
              </div>
              <p className="text-text text-base leading-relaxed">
                Climbs that humble you. Gravel roads no one knows about. West
                Maui Loops. Coffee at Grandma&apos;s. Sunsets, secret
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

          <p>
            This isn&apos;t a training club. There&apos;s no team kit. No
            captain, no paceline, no 5:30am ride leader you have to text.{" "}
            <strong className="text-text">
              Solo, but on the same island. We all end up at Loraine&apos;s
              eventually.
            </strong>
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
              . Life is short, and somewhere in between you have to leave room
              for a laugh. If you can&apos;t take a soft jab from an AI
              bookkeeper with strong opinions, this probably isn&apos;t your
              club.
            </p>
          </div>

          <p className="text-center text-mist text-base pt-6 font-semibold">
            — Vini
          </p>
        </div>
      </div>
    </section>
  );
}
