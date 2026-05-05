"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type Initiative,
  type Milestone,
  type ShippedItem,
  type InitiativeStatus,
  type InitiativeCategory,
  statusColor,
  categoryColor,
} from "@/lib/dashboard";

interface DashboardData {
  now: string;
  metrics: {
    days: {
      sinceLaunch: number;
      waitingOnStrava: number;
      untilDroneShoot: number;
    };
    community: {
      clubMembers: number;
      twelveCount: number;
      recentRides: number;
      recentMiles: number;
    };
    content: {
      eventsListed: number;
      upcomingEvents: number;
      gearPublished: number;
      gearTBD: number;
      routesPublished: number;
    };
    commerce: {
      productsLive: number;
      stripeWired: boolean;
    };
    tour: {
      stagesTotal: number;
      stagesWithRoute: number;
      stagesWithSegment: number;
    };
  };
  goals: { id: string; title: string; detail?: string }[];
  initiatives: Initiative[];
  milestones: Milestone[];
  shipped: ShippedItem[];
}

const LS_KEY = "cyclinghawaii_admin_pw";
const REFRESH_MS = 5 * 60 * 1000; // refresh every 5 minutes

export default function DashboardPage() {
  const [authPassword, setAuthPassword] = useState<string | null>(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Live clock
  const [clock, setClock] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cache password locally
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setAuthPassword(saved);
  }, []);

  const fetchData = useCallback(
    async (pw: string) => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/admin/dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw }),
        });
        if (res.status === 401) {
          localStorage.removeItem(LS_KEY);
          setAuthPassword(null);
          setErr("Session expired. Re-enter password.");
          return;
        }
        if (!res.ok) {
          setErr(`Failed (${res.status})`);
          return;
        }
        const json: DashboardData = await res.json();
        setData(json);
        setLastUpdated(new Date());
      } catch {
        setErr("Network error.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // On auth, fetch + start auto-refresh interval
  useEffect(() => {
    if (!authPassword) return;
    fetchData(authPassword);
    const t = setInterval(() => fetchData(authPassword), REFRESH_MS);
    return () => clearInterval(t);
  }, [authPassword, fetchData]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!pwInput) return;
    setPwError(null);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput }),
      });
      if (res.status === 401) {
        setPwError("Wrong password.");
        return;
      }
      setAuthPassword(pwInput);
      localStorage.setItem(LS_KEY, pwInput);
    } catch {
      setPwError("Network error.");
    }
  }

  // ─── Auth gate ────────────────────────────────────────
  if (!authPassword) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6 bg-gradient-to-b from-strava/10 via-bg to-bg">
        <div className="w-full max-w-[420px] bg-card border border-border rounded-2xl p-8 shadow-md">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-2 text-center">
            Mission Control
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-text mb-6 text-center">
            Cycling Hawaiʻi Ops
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              value={pwInput}
              onChange={(e) => setPwInput(e.target.value)}
              placeholder="Password"
              autoComplete="off"
              className="w-full px-4 py-3 rounded-xl bg-bg border border-border text-text focus:outline-none focus:border-strava"
              autoFocus
            />
            {pwError && (
              <div className="text-red-600 text-xs italic">{pwError}</div>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors"
            >
              Unlock
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading && !data) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-bg">
        <div className="text-mist text-sm uppercase tracking-widest">
          Loading mission control…
        </div>
      </main>
    );
  }

  if (err && !data) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-bg px-6">
        <div className="text-red-600 text-sm">{err}</div>
      </main>
    );
  }

  if (!data) return null;

  const { metrics, goals, initiatives, milestones, shipped } = data;

  const blocked = initiatives.filter((i) => i.status === "blocked");
  const active = initiatives.filter((i) => i.status === "active");
  const queued = initiatives.filter((i) => i.status === "queued");

  return (
    <main className="min-h-[100dvh] bg-bg pb-20">
      {/* ── Header strip ─────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-border">
        <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[0.6rem] font-bold tracking-[0.3em] uppercase text-strava">
              Mission Control
            </div>
            <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-lg leading-tight">
              Cycling Hawaiʻi · Ops
            </div>
          </div>
          <div className="text-right">
            <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base tabular-nums">
              {clock.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </div>
            <div className="text-[0.6rem] text-mist uppercase tracking-widest">
              Day {metrics.days.sinceLaunch} · {clock.toLocaleDateString([], { month: "short", day: "numeric" })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 pt-6 space-y-6">
        {/* ── Strava status banner (the gate) ───────── */}
        <section className="bg-yellow-500/10 border border-yellow-500/40 rounded-2xl p-5">
          <div className="flex items-start gap-4 flex-wrap">
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-widest text-yellow-700 mb-1">
                Awaiting Strava
              </div>
              <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-xl leading-tight">
                Athlete quota increase
              </div>
              <div className="text-mist text-sm italic mt-1">
                Submitted Apr 28. Day {metrics.days.waitingOnStrava} of waiting.
                Follow-up window opens day 10.
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold text-yellow-700 tabular-nums">
                {metrics.days.waitingOnStrava}
              </div>
              <div className="text-[0.6rem] uppercase tracking-widest text-yellow-700/70">
                days waiting
              </div>
            </div>
          </div>
        </section>

        {/* ── Live metrics grid ─────────────────────── */}
        <section>
          <SectionLabel>Live Metrics</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric
              label="Strava club"
              value={metrics.community.clubMembers}
              suffix="members"
            />
            <Metric
              label="Recent rides in feed"
              value={metrics.community.recentRides}
            />
            <Metric
              label="Miles together"
              value={metrics.community.recentMiles.toLocaleString()}
              suffix="mi"
            />
            <Metric
              label="Tour stages"
              value={`${metrics.tour.stagesWithRoute}/${metrics.tour.stagesTotal}`}
              suffix="wired"
            />
            <Metric
              label="Events listed"
              value={metrics.content.upcomingEvents}
              suffix={`upcoming · ${metrics.content.eventsListed} total`}
            />
            <Metric
              label="Routes published"
              value={metrics.content.routesPublished}
            />
            <Metric
              label="Gear reviews"
              value={metrics.content.gearPublished}
              suffix={`${metrics.content.gearTBD} TBD`}
            />
            <Metric
              label="Store products"
              value={metrics.commerce.productsLive}
              suffix={metrics.commerce.stripeWired ? "selling" : "preview"}
            />
          </div>
        </section>

        {/* ── Active now ─────────────────────────────── */}
        {(blocked.length > 0 || active.length > 0) && (
          <section>
            <SectionLabel>Active Now</SectionLabel>
            <div className="space-y-3">
              {blocked.map((i) => (
                <InitiativeCard key={i.id} item={i} />
              ))}
              {active.map((i) => (
                <InitiativeCard key={i.id} item={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── Calendar ──────────────────────────────── */}
        <section>
          <SectionLabel>What&apos;s Coming</SectionLabel>
          <div className="space-y-2">
            {milestones.map((m) => {
              const days = Math.ceil(
                (new Date(m.date + "T00:00:00").getTime() - clock.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              const urgent = days <= 7;
              return (
                <a
                  key={m.id}
                  href={m.url ?? "#"}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-strava transition-colors no-underline"
                >
                  <div className="w-16 text-center shrink-0">
                    <div
                      className={`font-[family-name:var(--font-space-grotesk)] font-bold text-2xl tabular-nums ${
                        urgent ? "text-strava" : "text-text"
                      }`}
                    >
                      {new Date(m.date + "T00:00:00").getDate()}
                    </div>
                    <div className="text-[0.55rem] uppercase tracking-widest text-mist">
                      {new Date(m.date + "T00:00:00").toLocaleDateString([], {
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-text text-sm leading-snug">
                      {m.title}
                    </div>
                    {m.detail && (
                      <div className="text-mist text-xs mt-0.5 line-clamp-1">
                        {m.detail}
                      </div>
                    )}
                  </div>
                  <div
                    className={`text-[0.6rem] font-bold uppercase tracking-wider px-2 py-1 rounded-full whitespace-nowrap ${
                      days < 0
                        ? "bg-mist/10 text-mist"
                        : urgent
                        ? "bg-strava text-white"
                        : "bg-mist/10 text-mist"
                    }`}
                  >
                    {days === 0
                      ? "Today"
                      : days === 1
                      ? "Tomorrow"
                      : days > 0
                      ? `In ${days}d`
                      : "Past"}
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* ── Strategic goals ───────────────────────── */}
        <section>
          <SectionLabel>Strategic Goals</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map((g) => (
              <div
                key={g.id}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-sm leading-tight mb-1">
                  {g.title}
                </div>
                {g.detail && (
                  <div className="text-mist text-xs italic leading-relaxed">
                    {g.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Backlog ───────────────────────────────── */}
        <section>
          <SectionLabel>Backlog · {queued.length}</SectionLabel>
          <div className="space-y-2">
            {queued.map((i) => (
              <InitiativeCard key={i.id} item={i} compact />
            ))}
          </div>
        </section>

        {/* ── Recently shipped ──────────────────────── */}
        <section>
          <SectionLabel>Recently Shipped</SectionLabel>
          <div className="space-y-1.5">
            {shipped.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg"
              >
                <span className="text-emerald-700 shrink-0">✓</span>
                <span className="font-semibold text-text text-sm flex-1">
                  {s.url ? (
                    <a
                      href={s.url}
                      className="hover:text-strava no-underline"
                    >
                      {s.title}
                    </a>
                  ) : (
                    s.title
                  )}
                </span>
                <span
                  className={`text-[0.55rem] uppercase tracking-widest font-semibold ${categoryColor(
                    s.category
                  )}`}
                >
                  {s.category}
                </span>
                <span className="text-[0.6rem] text-mist tabular-nums shrink-0">
                  {new Date(s.date + "T00:00:00").toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ────────────────────────────────── */}
        <footer className="text-center pt-6 text-mist/70 text-xs">
          {lastUpdated && (
            <div>
              Last refreshed{" "}
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · auto-refresh every 5 min
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(LS_KEY);
              setAuthPassword(null);
              setData(null);
            }}
            className="mt-2 italic hover:text-mist underline"
          >
            Sign out
          </button>
        </footer>
      </div>
    </main>
  );
}

// ─── Subcomponents ──────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-mist mb-2.5 px-1">
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-[0.55rem] uppercase tracking-widest text-mist mb-1 font-semibold">
        {label}
      </div>
      <div className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold text-text tabular-nums leading-none">
        {value}
      </div>
      {suffix && (
        <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-1">
          {suffix}
        </div>
      )}
    </div>
  );
}

function InitiativeCard({
  item,
  compact,
}: {
  item: Initiative;
  compact?: boolean;
}) {
  const colors = statusColor(item.status);
  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-xl ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} shrink-0`}
        >
          {labelStatus(item.status)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-sm leading-tight">
              {item.title}
            </span>
            <span
              className={`text-[0.55rem] uppercase tracking-widest font-semibold ${categoryColor(
                item.category as InitiativeCategory
              )}`}
            >
              {item.category}
            </span>
          </div>
          {item.detail && !compact && (
            <div className="text-mist text-xs mt-1 italic leading-relaxed">
              {item.detail}
            </div>
          )}
          {item.blockedBy && (
            <div className="text-yellow-700 text-[0.65rem] mt-1 italic">
              Blocked by: {item.blockedBy}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function labelStatus(s: InitiativeStatus): string {
  switch (s) {
    case "blocked":
      return "Waiting";
    case "active":
      return "Active";
    case "queued":
      return "Queued";
    case "shipped":
      return "Shipped";
  }
}
