import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getRiderBySlug,
  saveRider,
  isReservedSlug,
  type Rider,
} from "@/lib/rider-store";
import {
  getAthleteActivities,
  refreshUserToken,
} from "@/lib/strava-user";
import { metersToMiles, metersToFeet } from "@/lib/formatters";
import type { StravaActivity } from "@/types/strava";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedSlug(slug)) return { title: "Cycling Hawaii" };
  const rider = await getRiderBySlug(slug);
  if (!rider) return { title: "Cycling Hawaii" };
  return {
    title: `${rider.firstname} ${rider.lastname[0]}. — Cycling Hawaii`,
    description: `${rider.firstname}'s rides on Cycling Hawaii. Roasted by Laura.`,
  };
}

export default async function RiderPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { welcome } = await searchParams;

  if (isReservedSlug(slug)) notFound();

  const rider = await getRiderBySlug(slug);
  if (!rider) notFound();

  // Refresh access token if expired
  const accessToken = await ensureFreshToken(rider);

  // Fetch their recent rides
  const activities = await getAthleteActivities(accessToken, 10);
  const rides = activities.filter(
    (a) => a.type === "Ride" || a.sport_type === "Ride"
  );

  // Quick stats from this batch
  const totalMiles = Math.round(
    rides.reduce((s, a) => s + metersToMiles(a.distance), 0)
  );
  const totalElev = Math.round(
    rides.reduce((s, a) => s + metersToFeet(a.total_elevation_gain), 0)
  );
  const totalRides = rides.length;

  return (
    <main>
      <Hero rider={rider} welcome={welcome === "1"} />
      {rides.length > 0 ? (
        <>
          <Stats miles={totalMiles} elev={totalElev} rides={totalRides} />
          <RecentRides rides={rides.slice(0, 8)} />
        </>
      ) : (
        <EmptyState />
      )}
      <Footer />
    </main>
  );
}

// ─── Token refresh wrapper ────────────────────────────────────
async function ensureFreshToken(rider: Rider): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (rider.tokenExpiresAt > now + 60) return rider.accessToken;
  try {
    const refreshed = await refreshUserToken(rider.refreshToken);
    const updated: Rider = {
      ...rider,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      tokenExpiresAt: refreshed.expires_at,
    };
    await saveRider(updated);
    return refreshed.access_token;
  } catch (err) {
    console.error("Token refresh failed for rider:", rider.slug, err);
    return rider.accessToken;
  }
}

// ──────────────────── Hero ────────────────────
function Hero({ rider, welcome }: { rider: Rider; welcome: boolean }) {
  return (
    <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          {welcome ? "Welcome to The Roast" : "On the Roast"}
        </div>

        <div className="flex justify-center mb-5">
          <div className="relative w-[120px] h-[120px] md:w-[144px] md:h-[144px] rounded-full overflow-hidden border-4 border-strava/30 shadow-lg">
            {rider.profile && rider.profile !== "avatar/athlete/large.png" ? (
              <Image
                src={rider.profile}
                alt={`${rider.firstname} ${rider.lastname[0]}.`}
                fill
                sizes="144px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-strava/15 text-strava flex items-center justify-center font-bold text-4xl">
                {rider.firstname[0]}
                {rider.lastname[0]}
              </div>
            )}
          </div>
        </div>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl font-bold tracking-tight text-text leading-[0.95] mb-3">
          {rider.firstname} {rider.lastname}
        </h1>
        {(rider.city || rider.state) && (
          <p className="text-mist text-sm uppercase tracking-widest">
            {[rider.city, rider.state].filter(Boolean).join(" · ")}
          </p>
        )}
        {welcome && (
          <p className="mt-6 text-mist text-base italic max-w-[520px] mx-auto leading-relaxed">
            Connected. Laura&apos;s read your last few rides. Don&apos;t worry,
            she only roasts who deserve it. (Everyone deserves it.)
          </p>
        )}
      </div>
    </section>
  );
}

// ─────────────────── Stats ────────────────────
function Stats({
  miles,
  elev,
  rides,
}: {
  miles: number;
  elev: number;
  rides: number;
}) {
  return (
    <section className="py-12 px-6 bg-bg">
      <div className="max-w-[700px] mx-auto">
        <div className="grid grid-cols-3 gap-4 text-center bg-card border border-border rounded-2xl p-6 shadow-sm">
          <Stat value={miles.toLocaleString()} label="Recent Miles" />
          <Stat value={elev.toLocaleString()} label="Feet Climbed" />
          <Stat value={rides.toString()} label="Rides Logged" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-strava">
        {value}
      </div>
      <div className="text-[0.65rem] uppercase tracking-widest text-mist mt-1">
        {label}
      </div>
    </div>
  );
}

// ──────────────── Recent Rides ────────────────
function RecentRides({ rides }: { rides: StravaActivity[] }) {
  return (
    <section className="py-16 px-6 bg-surface">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            The Logbook
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            Recent rides
          </h2>
          <p className="text-mist text-sm italic">
            Pulled live from Strava. Laura&apos;s blogs are coming next.
          </p>
        </div>

        <div className="space-y-3">
          {rides.map((r) => (
            <RideCard key={r.id} ride={r} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RideCard({ ride }: { ride: StravaActivity }) {
  const miles = Math.round(metersToMiles(ride.distance));
  const elev = Math.round(metersToFeet(ride.total_elevation_gain));
  const hours = ride.moving_time / 3600;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const time = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const date = new Date(ride.start_date_local).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-5 flex items-start gap-4">
      <div className="w-1 self-stretch bg-strava rounded-full" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap text-xs text-mist uppercase tracking-wider mb-1">
          <span>{date}</span>
          <span>·</span>
          <span>{ride.sport_type || ride.type}</span>
        </div>
        <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base md:text-lg leading-tight mb-3 line-clamp-2">
          {ride.name}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <MiniStat value={miles.toString()} label="mi" />
          <MiniStat value={elev.toLocaleString()} label="ft" />
          <MiniStat value={time} label="time" />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
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

// ────────────── Empty State ───────────────────
function EmptyState() {
  return (
    <section className="py-20 px-6 bg-surface">
      <div className="max-w-[600px] mx-auto text-center">
        <p className="text-mist italic text-base">
          No rides on file yet. Go ride. Laura will be waiting.
        </p>
      </div>
    </section>
  );
}

// ─────────────── Footer ───────────────────────
function Footer() {
  return (
    <section className="py-16 px-6 bg-bg">
      <div className="max-w-[600px] mx-auto text-center space-y-5">
        <a
          href="/roast"
          className="inline-block text-strava font-semibold text-sm uppercase tracking-wider hover:text-strava/80"
        >
          ← Back to The Roast
        </a>
        <p className="text-[0.65rem] uppercase tracking-widest text-mist">
          Powered by Strava
        </p>
        <p className="text-mist text-xs italic">
          Want to disconnect? Email laura@cyclinghawaii.com.
        </p>
      </div>
    </section>
  );
}
