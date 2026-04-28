import type { Metadata } from "next";
import Image from "next/image";
import { getClubData, type ClubMember } from "@/lib/club";
import { assignRoles } from "@/lib/peloton-roles";
import { safeInitial } from "@/lib/laura-club";

export const metadata: Metadata = {
  title: "The Roast — Cycling Hawaii",
  description:
    "Cycling Hawaii's invite-only roast list. Connect your Strava, ride your rides, and let Laura write about it. Free. Hilarious. Optional.",
};

export const revalidate = 900;

const STRAVA_CLUB_URL = "https://www.strava.com/clubs/cyclinghawaii";

export default async function RoastPage() {
  const club = await getClubData();
  const members = club ? club.members.slice(0, 12) : [];
  const roles =
    club && members.length > 0 ? assignRoles(members, club.activities) : null;

  return (
    <main>
      <Hero />
      <HowItWorks />
      {roles && members.length > 0 && (
        <CurrentTwelve members={members} roles={roles} />
      )}
      <Steps />
      <FAQ />
      <FinalCTA />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero() {
  return (
    <section className="relative w-full pt-32 pb-20 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          Invite Only
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-text leading-[0.95] mb-6">
          Get
          <span className="text-strava"> Roasted.</span>
        </h1>
        <p className="text-mist text-lg md:text-xl max-w-[640px] mx-auto leading-relaxed">
          Cycling Hawaiʻi&apos;s roast list. Connect your Strava, ride your
          rides, and let Laura — our resident AI bookkeeper — write about it.
          Lovingly. Often.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8 text-mist text-sm">
          <span>Free</span>
          <span className="text-mist/40">·</span>
          <span>Invite-only</span>
          <span className="text-mist/40">·</span>
          <span>Quit anytime</span>
        </div>
      </div>
    </section>
  );
}

// ───────────────── How It Works ─────────────────
function HowItWorks() {
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Concept
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
            Twelve riders. One Laura.
          </h2>
          <p className="text-mist text-base max-w-[640px] mx-auto leading-relaxed">
            The Roast is a curated list of twelve cyclists in The Cycling
            Hawaii Strava club. Each one gets a peloton role — Leader,
            Climber, Sprinter, Lanterne Rouge, the works — and Laura roasts
            their rides on cyclinghawaii.com.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <Card
            number="01"
            title="Ride your ride."
            body="Whatever that looks like. Laura roasts everyone equally. Slow rides, fast rides, accidental coffee tours — all qualify."
          />
          <Card
            number="02"
            title="Get a role."
            body="The Twelve get auto-assigned peloton roles based on how you actually ride. The Leader. The Sprinter. The Climber. The Lanterne Rouge."
          />
          <Card
            number="03"
            title="Laura writes."
            body="Each of your rides gets a personal blog entry from Laura. Sarcasm by default. Praise when earned — and only when earned."
          />
        </div>
      </div>
    </section>
  );
}

function Card({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
      <div className="text-strava font-[family-name:var(--font-space-grotesk)] font-bold text-2xl mb-3">
        {number}
      </div>
      <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-lg mb-2">
        {title}
      </div>
      <p className="text-mist text-sm leading-relaxed">{body}</p>
    </div>
  );
}

// ──────────────── Current Twelve ────────────────
function CurrentTwelve({
  members,
  roles,
}: {
  members: ClubMember[];
  roles: Map<string, { role: string; blurb: string }>;
}) {
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Current Lineup
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
            The Twelve, right now
          </h2>
          <p className="text-mist text-base italic max-w-[520px] mx-auto">
            Roles auto-assigned by Laura from real club activity. Refreshed
            daily.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m, i) => {
            const memberKey = `${m.firstname} ${m.lastname[0]}.`;
            const role = roles.get(memberKey);
            const initials = `${safeInitial(m.firstname)}${safeInitial(
              m.lastname
            )}`;
            return (
              <div
                key={`${m.firstname}-${m.lastname}-${i}`}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
              >
                {m.profile && m.profile !== "avatar/athlete/large.png" ? (
                  <Image
                    src={m.profile}
                    alt={memberKey}
                    width={48}
                    height={48}
                    className="rounded-full object-cover shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-strava/15 text-strava flex items-center justify-center font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-text truncate">
                    {m.firstname} {m.lastname[0]}.
                  </div>
                  <div className="text-[0.65rem] font-bold uppercase tracking-wider text-strava mt-0.5">
                    {role?.role ?? "Recruit"}
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

// ──────────────────── Steps ─────────────────────
function Steps() {
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            How to Get On
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-3">
            The path to the roast
          </h2>
          <p className="text-mist text-base max-w-[600px] mx-auto leading-relaxed">
            Three steps. The first is public. The rest unlock as the platform
            opens up to invitees.
          </p>
        </div>

        <div className="space-y-4">
          <Step
            num="1"
            title="Join the Cycling Hawaiʻi Strava club"
            body="The roast list is built from active club members. Membership is the gate."
            cta={
              <a
                href={STRAVA_CLUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-strava text-white font-semibold text-xs uppercase tracking-wider hover:bg-strava/90 transition-colors"
              >
                Join on Strava
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            }
            status="open"
          />
          <Step
            num="2"
            title="Ride. Tag #cyclinghawaii."
            body="Tag your activities. Tagged rides get pinned on The Wall with a custom Laura roast — visible to everyone, today, no setup."
            status="open"
          />
          <Step
            num="3"
            title="Connect your Strava (private link)"
            body="Coming soon. Active members will get invited to connect their Strava and unlock a personal page where Laura blogs every ride. Your link, your control. Quit anytime."
            status="soon"
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  num,
  title,
  body,
  cta,
  status,
}: {
  num: string;
  title: string;
  body: string;
  cta?: React.ReactNode;
  status: "open" | "soon";
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="shrink-0 w-12 h-12 rounded-full bg-strava/10 text-strava flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-bold text-xl">
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base md:text-lg">
            {title}
          </h3>
          {status === "open" ? (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
              Open
            </span>
          ) : (
            <span className="text-[0.6rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mist/15 text-mist">
              Coming Soon
            </span>
          )}
        </div>
        <p className="text-mist text-sm leading-relaxed">{body}</p>
      </div>
      {cta && <div className="shrink-0">{cta}</div>}
    </div>
  );
}

// ─────────────────── FAQ ────────────────────────
function FAQ() {
  return (
    <section className="py-20 px-6 bg-bg">
      <div className="max-w-[720px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            Fair Questions
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
            What you&apos;re probably wondering
          </h2>
        </div>

        <div className="space-y-3">
          <Q
            q="Will Laura actually be mean?"
            a="Sarcastic, not mean. She roasts the way friends roast each other — sharper than a comment, softer than a takedown. Praise lands when earned, and only then. That's what makes it land."
          />
          <Q
            q="What does she write about?"
            a="Your actual ride data. Distance, elevation, time, how often you ride, your patterns. She knows when you cruised, when you went hard, when you took a coffee detour. The data does the work; Laura does the voice."
          />
          <Q
            q="Is my data private?"
            a="Yes. Connecting Strava only shares your ride data with this site — not with anyone else. Your personal page is at a URL you control. You can disconnect anytime and the page goes away."
          />
          <Q
            q="What if I'm slow?"
            a="Most of us are. Laura roasts equally. Speed is one input among many. The Lanterne Rouge role exists for a reason."
          />
          <Q
            q="Why only twelve?"
            a="Twelve fits a peloton, a dozen, a council. Small enough to feel exclusive. Large enough that everyone gets a real roast. Anyone who falls out of The Twelve quietly drops to recruit status — riding gets you back in."
          />
          <Q
            q="When does the personal-page feature actually open?"
            a="Soon. We're inviting friends one by one. If you want in early, join the Strava club and tag #cyclinghawaii on your next ride. Vini will reach out."
          />
        </div>
      </div>
    </section>
  );
}

function Q({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-card border border-border rounded-xl p-5 md:p-6 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base flex items-center justify-between gap-4">
        <span>{q}</span>
        <span className="text-mist group-open:rotate-45 transition-transform shrink-0">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </summary>
      <p className="text-mist text-sm leading-relaxed mt-3">{a}</p>
    </details>
  );
}

// ─────────────────── Final CTA ──────────────────
function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-surface">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-3">
          Step One
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text mb-5">
          Join the club. The rest follows.
        </h2>
        <p className="text-mist text-base mb-10 max-w-[520px] mx-auto leading-relaxed">
          Membership is free. Roasting is opt-in. The whole thing exists to
          make our rides — and the way we share them — a little more fun.
        </p>

        <a
          href={STRAVA_CLUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors shadow-lg shadow-strava/20"
        >
          Join the Cycling Hawaiʻi Strava Club
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

        <p className="text-mist text-xs italic mt-8">
          Already in? You&apos;re on the path. Vini will be in touch about
          Step 3.
        </p>
      </div>
    </section>
  );
}
