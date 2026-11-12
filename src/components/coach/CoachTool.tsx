"use client";

// The coach. Reads rides from one of three places:
//
//   - ride files (FIT, GPX, TCX) parsed right here in the browser and
//     kept in this browser only
//   - Strava, for the site owner or a signed-in connected rider, via
//     the private /api/coach/activities route
//   - a made-up sample rider
//
// All analysis runs in the browser. The only thing that can leave it
// is the compact summary sent when the rider asks for the AI read.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Badge, Button, Callout, Card, SectionTitle, buttonClass, display } from "@/components/ToolUi";
import { analyzeRides } from "@/lib/coach/analysis";
import { isGzip, parseRideFile } from "@/lib/coach/parsers";
import { rulesRead } from "@/lib/coach/rules";
import { sampleRides } from "@/lib/coach/sample";
import {
  clearImportedRides,
  loadImportedRides,
  loadProfile,
  rideIdFor,
  saveImportedRides,
  saveProfile,
} from "@/lib/coach/storage";
import { buildSummary } from "@/lib/coach/summary";
import { summarizeRide } from "@/lib/coach/summarize";
import type { CoachRead, CoachRide, RiderProfile, SessionKind } from "@/lib/coach/types";
import { summarizeSession, type FitSummary } from "@/lib/fit/analyze";
import { listSessions } from "@/lib/fit/storage";
import {
  IntensityBar,
  LoadChart,
  RideCalendar,
  Sparkline,
  WeeklyHoursChart,
  hoursText,
  shortDay,
} from "./charts";

type Source = "files" | "strava" | "sample";

/** The admin dashboard remembers the password under this key; the coach reuses it so the owner signs in once. */
const ADMIN_PW_KEY = "cyclinghawaii_admin_pw";

const STRAVA_ERRORS: Record<string, string> = {
  "sign-in":
    "Strava rides are only ever shown to the rider they belong to. Sign in first. If this is your site, enter the admin password below.",
  "not-connected":
    "You are signed in with Strava, but your rides are not connected to this site yet. Connect on the Roast page, then come back.",
  "no-strava": "Your sign-in is not a Strava account, so there are no rides to load. Import ride files instead.",
  "not-configured": "Strava is not set up on this server yet.",
  "strava-unavailable": "Strava did not answer. Try again in a few minutes.",
  "slow-down": "Too many password attempts. Wait ten minutes and try again.",
};

const AI_ERRORS: Record<string, string> = {
  "sign-in": "The AI read is for signed-in riders. The read below is the built-in one and does not need it.",
  "slow-down": "That is enough AI reads for now. The read only changes when your rides do. Try again in an hour.",
  "rate-limited": "The AI coach is busy. Try again in a minute.",
  "not-configured": "The AI read is not switched on for this site.",
};

const KIND_TONE: Record<SessionKind, string> = {
  rest: "bg-surface text-mist",
  easy: "bg-[#cde2fb] text-[#0d366b]",
  endurance: "bg-[#cde2fb] text-[#0d366b]",
  long: "bg-[#2a78d6] text-white",
  tempo: "bg-[#184f95] text-white",
  hard: "bg-[#104281] text-white",
  skills: "bg-[#86b6ef] text-[#0b0b0b]",
};

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function readRideFile(file: File): Promise<ArrayBuffer> {
  const data = await file.arrayBuffer();
  if (isGzip(data) && typeof DecompressionStream !== "undefined") {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Response(stream).arrayBuffer();
  }
  return data;
}

function delta(now: number, before: number): string | null {
  if (before <= 0 || now <= 0) return null;
  const change = Math.round(((now - before) / before) * 100);
  if (change === 0) return "same as the four weeks before";
  return `${change > 0 ? "+" : "−"}${Math.abs(change)}% on the four weeks before`;
}

function Tile({ label, value, note, children }: { label: string; value: string; note?: string | null; children?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs text-mist">{label}</div>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div className={`${display} text-2xl font-semibold text-text`}>{value}</div>
        {children}
      </div>
      {note && <div className="mt-1 text-xs text-mist leading-snug">{note}</div>}
    </div>
  );
}

function NumberField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint: string;
  value: number | undefined;
  placeholder: string;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-text">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(e.target.value === "" || !Number.isFinite(n) || n <= 0 ? undefined : n);
        }}
        className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-text tabular-nums"
      />
      <span className="mt-1 block text-xs text-mist leading-snug">{hint}</span>
    </label>
  );
}

function ReadView({ read }: { read: CoachRead }) {
  return (
    <div className="space-y-5" data-testid="coach-read" data-source={read.source}>
      <p className={`${display} text-xl md:text-2xl font-bold tracking-tight text-text`} data-testid="coach-headline">
        {read.headline}
      </p>

      {read.goingWell.length > 0 && (
        <Card>
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">What is going well</div>
          <ul className="space-y-1.5 text-[0.95rem] text-text/90 leading-relaxed">
            {read.goingWell.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden="true" className="text-emerald-600">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-strava/40 shadow-sm" data-testid="coach-focus">
        <div className="text-xs font-semibold uppercase tracking-widest text-strava mb-2">The one thing this week</div>
        <h3 className={`${display} text-2xl md:text-3xl font-bold tracking-tight text-text mb-5`}>{read.focus.title}</h3>
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              ["What I see", read.focus.observe],
              ["The cue", read.focus.cue],
              ["The drill", read.focus.drill],
              ["Then re-check", read.focus.recheck],
            ] as const
          ).map(([title, body]) => (
            <div key={title}>
              <div className="text-xs font-semibold uppercase tracking-widest text-mist mb-1">{title}</div>
              <p className="text-text/90 text-[0.95rem] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </Card>

      {read.fitNote && (
        <Callout title="From your bike fit">
          {read.fitNote}{" "}
          <Link href="/fit" className="text-strava font-semibold underline-offset-4 hover:underline">
            Open the fit tool
          </Link>
        </Callout>
      )}

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <h3 className="font-semibold text-text">A week that fits</h3>
          <span className="text-sm text-mist">
            About {hoursText(read.week.reduce((s, d) => s + d.minutes, 0) / 60)} of riding
          </span>
        </div>
        <ol className="grid gap-2 md:grid-cols-7 list-none" data-testid="coach-week">
          {read.week.map((d) => (
            <li key={d.day} className="bg-card border border-border rounded-xl p-3 flex md:flex-col gap-3 md:gap-1.5">
              <div className="w-12 md:w-auto shrink-0">
                <div className="text-xs font-semibold uppercase tracking-widest text-mist">{d.day}</div>
                <div className="text-sm font-semibold text-text tabular-nums">{d.minutes > 0 ? hoursText(d.minutes / 60) : "–"}</div>
              </div>
              <div className="min-w-0">
                <span className={`inline-block text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${KIND_TONE[d.kind]}`}>
                  {d.title}
                </span>
                <p className="mt-1.5 text-xs text-text/80 leading-relaxed">{d.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {read.caveats.length > 0 && (
        <Callout tone="warn" title="How far to trust this">
          <ul className="list-disc pl-5 space-y-1">
            {read.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Callout>
      )}
    </div>
  );
}

const subscribeToNothing = () => () => {};

export default function CoachTool() {
  const [profile, setProfile] = useState<RiderProfile>({});
  const [source, setSource] = useState<Source | null>(null);
  const [fileRides, setFileRides] = useState<CoachRide[]>([]);
  const [stravaRides, setStravaRides] = useState<CoachRide[] | null>(null);
  const [fit, setFit] = useState<FitSummary | null>(null);
  const [useFit, setUseFit] = useState(true);
  const [importNote, setImportNote] = useState<{ tone: "good" | "warn" | "bad"; text: string } | null>(null);
  const [stravaState, setStravaState] = useState<{ busy: boolean; error: string | null; needPassword: boolean }>({ busy: false, error: null, needPassword: false });
  const [password, setPassword] = useState("");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [ai, setAi] = useState<{ busy: boolean; error: string | null; needsSignIn?: boolean; read: CoachRead | null; forKey: string | null }>({ busy: false, error: null, read: null, forKey: null });
  const [showAi, setShowAi] = useState(true);

  // Today's date in the rider's own time zone. Null while the page is
  // server-rendered, so the server and the first client render agree.
  const today = useSyncExternalStore(
    subscribeToNothing,
    () => localDayKey(new Date()),
    () => null
  );

  // Everything stored in this browser is read once, after mount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [rides, sessions] = await Promise.all([
        loadImportedRides().catch(() => [] as CoachRide[]),
        listSessions().catch(() => []),
      ]);
      if (cancelled) return;
      setProfile(loadProfile());
      try {
        setPassword(localStorage.getItem(ADMIN_PW_KEY) ?? "");
      } catch {
        // No storage: the owner just types the password each time.
      }
      setFileRides(rides);
      if (rides.length > 0) setSource((s) => s ?? "files");
      // A session made from the sample rider is not this rider's fit.
      const latest = sessions.find((s) => Object.values(s.frames).some((f) => f?.source !== "sample"));
      if (latest) setFit(summarizeSession(latest));
    })();
    fetch("/api/coach/read", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setAiConfigured(data?.configured === true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const updateProfile = (patch: Partial<RiderProfile>) => {
    setProfile((p) => {
      const next = { ...p, ...patch };
      saveProfile(next);
      return next;
    });
  };

  const rides = useMemo<CoachRide[]>(() => {
    if (!today || !source) return [];
    if (source === "sample") return sampleRides(today);
    if (source === "strava") return stravaRides ?? [];
    return fileRides;
  }, [today, source, fileRides, stravaRides]);

  const analysis = useMemo(() => (today ? analyzeRides(rides, profile, today) : null), [rides, profile, today]);
  const fitForRead = useFit && source !== "sample" ? fit : null;
  const baseline = useMemo(() => (analysis ? rulesRead(analysis, fitForRead) : null), [analysis, fitForRead]);
  const summary = useMemo(
    () => (analysis && baseline ? buildSummary(analysis, baseline, fitForRead) : null),
    [analysis, baseline, fitForRead]
  );
  const summaryKey = useMemo(() => (summary ? JSON.stringify(summary) : null), [summary]);
  const aiRead = ai.read && ai.forKey === summaryKey ? ai.read : null;
  const read = aiRead && showAi ? aiRead : baseline;

  // ── Files ──
  const importFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const added: CoachRide[] = [];
    const skipped: string[] = [];
    for (const file of Array.from(list).slice(0, 400)) {
      try {
        const parsed = parseRideFile(await readRideFile(file));
        const first = parsed.session?.startTime ?? parsed.samples[0]?.t;
        const offset = first ? -new Date(first * 1000).getTimezoneOffset() : -new Date().getTimezoneOffset();
        const result = summarizeRide(parsed, {
          id: "pending",
          fallbackName: file.name.replace(/\.(fit|gpx|tcx)(\.gz)?$/i, ""),
          utcOffsetMin: offset,
        });
        if (!result.ok) {
          skipped.push(`${file.name}: ${result.reason}`);
          continue;
        }
        const ride = result.ride;
        ride.id = rideIdFor(ride.start, ride.movingSec, ride.distanceM);
        added.push(ride);
      } catch (error) {
        skipped.push(`${file.name}: ${error instanceof Error ? error.message : "could not be read."}`);
      }
    }
    if (added.length > 0) {
      const merged = new Map(fileRides.map((r) => [r.id, r]));
      for (const ride of added) merged.set(ride.id, ride);
      const next = [...merged.values()];
      setFileRides(next);
      setSource("files");
      saveImportedRides(added).catch(() =>
        setImportNote({ tone: "warn", text: "Rides were read, but this browser would not store them. They will be gone when you close the tab." })
      );
    }
    const parts: string[] = [];
    if (added.length > 0) parts.push(`Read ${added.length} ride${added.length === 1 ? "" : "s"}.`);
    if (skipped.length > 0) parts.push(`Skipped ${skipped.length}: ${skipped.slice(0, 3).join(" ")}${skipped.length > 3 ? " ..." : ""}`);
    setImportNote({ tone: added.length === 0 ? "bad" : skipped.length ? "warn" : "good", text: parts.join(" ") });
  };

  const forgetFiles = async () => {
    if (!window.confirm("Remove every imported ride from this browser?")) return;
    await clearImportedRides().catch(() => {});
    setFileRides([]);
    setImportNote(null);
    if (source === "files") setSource(null);
  };

  // ── Strava ──
  const loadStrava = useCallback(
    async (withPassword: boolean) => {
      setStravaState({ busy: true, error: null, needPassword: withPassword });
      try {
        const res = await fetch("/api/coach/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify(withPassword && password ? { password } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const code = typeof data?.error === "string" ? data.error : "strava-unavailable";
          setStravaState({ busy: false, error: STRAVA_ERRORS[code] ?? STRAVA_ERRORS["strava-unavailable"], needPassword: code === "sign-in" });
          return;
        }
        if (withPassword && password) {
          try {
            localStorage.setItem(ADMIN_PW_KEY, password);
          } catch {
            // Fine: it just will not be remembered.
          }
        }
        setStravaRides(Array.isArray(data.rides) ? (data.rides as CoachRide[]) : []);
        setSource("strava");
        setStravaState({ busy: false, error: null, needPassword: false });
      } catch {
        setStravaState({ busy: false, error: STRAVA_ERRORS["strava-unavailable"], needPassword: withPassword });
      }
    },
    [password]
  );

  // ── AI read ──
  const askAi = async () => {
    if (!summary || !summaryKey) return;
    setAi({ busy: true, error: null, read: ai.read, forKey: ai.forKey });
    try {
      const res = await fetch("/api/coach/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ summary, ...(password ? { password } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.read) {
        const code = typeof data?.error === "string" ? data.error : "error";
        setAi({
          busy: false,
          error: AI_ERRORS[code] ?? "The AI coach could not write a read just now. The read below still stands.",
          needsSignIn: code === "sign-in",
          read: null,
          forKey: null,
        });
        return;
      }
      setAi({ busy: false, error: null, read: data.read as CoachRead, forKey: summaryKey });
      setShowAi(true);
    } catch {
      setAi({ busy: false, error: "The AI coach could not be reached. The read below still stands.", read: null, forKey: null });
    }
  };

  const hasRides = !!analysis && analysis.rideCount > 0;
  const weeklyCadence = analysis?.weeks.map((w) => w.avgCadence) ?? [];

  return (
    <div className="space-y-14">
      {/* ───────────── Rides in ───────────── */}
      <section aria-labelledby="coach-data">
        <SectionTitle eyebrow="Step 1" title="Bring your rides">
          <span id="coach-data">
            Using Cadence, a Garmin, a Wahoo or just your phone? They all sync to Strava and can
            all export ride files. Either route works here.
          </span>
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-3">
          <Card className={source === "files" ? "border-strava" : ""}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-text">Ride files</h3>
              {fileRides.length > 0 && <Badge tone="good">{fileRides.length} stored</Badge>}
            </div>
            <p className="text-sm text-mist leading-relaxed mb-3">
              FIT, GPX or TCX, as many as you like. They are read in this browser and stay in
              this browser. Nothing is uploaded.
            </p>
            <div className="flex flex-wrap gap-2">
              <label className={buttonClass("accent", "sm")}>
                Import ride files
                <input
                  type="file"
                  multiple
                  accept=".fit,.gpx,.tcx,.gz,application/gpx+xml,application/vnd.garmin.tcx+xml,application/octet-stream"
                  className="sr-only"
                  data-testid="ride-files"
                  onChange={(e) => {
                    void importFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {fileRides.length > 0 && source !== "files" && (
                <Button variant="ghost" size="sm" onClick={() => setSource("files")}>
                  Show these
                </Button>
              )}
              {fileRides.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => void forgetFiles()}>
                  Remove
                </Button>
              )}
            </div>
            {importNote && (
              <p className={`mt-3 text-xs leading-relaxed ${importNote.tone === "bad" ? "text-red-700" : importNote.tone === "warn" ? "text-amber-800" : "text-emerald-800"}`} data-testid="import-note" role="status">
                {importNote.text}
              </p>
            )}
          </Card>

          <Card className={source === "strava" ? "border-strava" : ""}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-semibold text-text">Strava</h3>
              {stravaRides && <Badge tone="good">{stravaRides.length} rides</Badge>}
            </div>
            <p className="text-sm text-mist leading-relaxed mb-3">
              Your last six months of rides, totals only. Shown to you and nobody else: the site
              owner, or a signed-in rider who has connected Strava.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="accent" size="sm" onClick={() => void loadStrava(false)} disabled={stravaState.busy} data-testid="load-strava">
                {stravaState.busy ? "Asking Strava…" : stravaRides ? "Refresh from Strava" : "Load my Strava rides"}
              </Button>
              {stravaRides && source !== "strava" && (
                <Button variant="ghost" size="sm" onClick={() => setSource("strava")}>
                  Show these
                </Button>
              )}
            </div>
            {stravaState.error && (
              <p className="mt-3 text-xs text-amber-800 leading-relaxed" role="status" data-testid="strava-note">
                {stravaState.error}
              </p>
            )}
            {stravaState.needPassword && (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadStrava(true);
                }}
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin password"
                  aria-label="Admin password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text"
                />
                <Button type="submit" variant="primary" size="sm" disabled={!password || stravaState.busy}>
                  Go
                </Button>
              </form>
            )}
          </Card>

          <Card className={source === "sample" ? "border-strava" : ""}>
            <h3 className="font-semibold text-text mb-1">Just looking</h3>
            <p className="text-sm text-mist leading-relaxed mb-3">
              See how the coach reads a made-up Maui rider: fourteen weeks of road, gravel and
              rollers, with a couple of habits worth fixing.
            </p>
            <Button variant={source ? "ghost" : "accent"} size="sm" onClick={() => setSource("sample")} data-testid="load-sample-rides">
              Show the sample rider
            </Button>
          </Card>
        </div>
      </section>

      {!hasRides && (
        <Callout title={source ? "No rides to read yet" : "Nothing loaded yet"}>
          {source === "strava"
            ? "Strava returned no bike rides in the last six months."
            : "Import a few ride files, load Strava, or open the sample rider to see what the coach does."}
        </Callout>
      )}

      {hasRides && analysis && read && baseline && (
        <>
          {/* ───────────── The read ───────────── */}
          <section aria-labelledby="coach-read-title">
            <SectionTitle eyebrow="Step 2" title="The coach's read">
              <span id="coach-read-title">
                What is working, one thing to change, a drill for it, and when to look again.
              </span>
            </SectionTitle>

            {source === "sample" && (
              <div className="mb-4">
                <Callout>This is the sample rider, not you. Import your own rides to get your own read.</Callout>
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {aiRead ? (
                <>
                  <Badge tone={showAi ? "good" : "neutral"}>{showAi ? "Written by Claude" : "Built-in rules"}</Badge>
                  <button type="button" className="text-sm font-semibold text-strava" onClick={() => setShowAi((v) => !v)}>
                    {showAi ? "Show the built-in read" : "Show Claude's read"}
                  </button>
                </>
              ) : (
                <Badge>Built-in rules</Badge>
              )}
              {aiConfigured && !aiRead && (
                <Button variant="primary" size="sm" onClick={() => void askAi()} disabled={ai.busy} data-testid="ask-ai">
                  {ai.busy ? "The coach is reading…" : "Ask the AI coach"}
                </Button>
              )}
              {fit && source !== "sample" && (
                <label className="inline-flex items-center gap-1.5 text-sm text-mist cursor-pointer">
                  <input type="checkbox" className="accent-strava" checked={useFit} onChange={(e) => setUseFit(e.target.checked)} />
                  include my last bike fit
                </label>
              )}
            </div>
            {aiConfigured && !aiRead && (
              <p className="mb-4 text-xs text-mist leading-relaxed max-w-[70ch]">
                The AI read sends your weekly totals and the numbers on this page to this
                site&apos;s server and on to Anthropic&apos;s Claude. It does not send ride
                files, ride names, routes, locations or photos.
              </p>
            )}
            {ai.error && (
              <p className="mb-4 text-sm text-amber-800" role="status" data-testid="ai-note">
                {ai.error}{" "}
                {ai.needsSignIn && (
                  <Link href="/signin?next=/coach" className="font-semibold text-strava underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                )}
              </p>
            )}

            <ReadView read={read} />
          </section>

          {/* ───────────── The evidence ───────────── */}
          <section aria-labelledby="coach-numbers">
            <SectionTitle eyebrow="Step 3" title="What the coach is looking at">
              <span id="coach-numbers">
                {analysis.rideCount} rides since {analysis.firstDay ? shortDay(analysis.firstDay) : "the start"}. Hover,
                tap or use the arrow keys on any chart for the numbers.
              </span>
            </SectionTitle>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-6" data-testid="coach-tiles">
              <Tile label="Riding time, last 4 weeks" value={hoursText(analysis.last28.hours)} note={delta(analysis.last28.hours, analysis.prev28.hours)} />
              <Tile
                label="Distance and climbing"
                value={`${Math.round(analysis.last28.distanceM / 1609.344)} mi`}
                note={`${Math.round(analysis.last28.climbM * 3.28084).toLocaleString("en-US")} ft climbed`}
              />
              <Tile
                label="Rides a week"
                value={analysis.consistency.ridesPerWeek.toFixed(1)}
                note={`Rode in ${analysis.consistency.weeksRidden} of the last ${analysis.consistency.weeksConsidered} weeks`}
              />
              <Tile
                label="Average cadence"
                value={analysis.cadence.recent !== undefined ? `${Math.round(analysis.cadence.recent)} rpm` : "–"}
                note={
                  analysis.cadence.recent === undefined
                    ? "No cadence sensor in these rides"
                    : analysis.cadence.trend === "up"
                      ? "Rising over the last eight weeks"
                      : analysis.cadence.trend === "down"
                        ? "Falling over the last eight weeks"
                        : "Weekly average, last 12 weeks"
                }
              >
                <Sparkline values={weeklyCadence} />
              </Tile>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <h3 className="font-semibold text-text mb-3">Hours ridden each week</h3>
                <WeeklyHoursChart weeks={analysis.weeks} />
              </Card>
              <Card>
                <h3 className="font-semibold text-text mb-1">Fitness, fatigue and form</h3>
                <p className="text-xs text-mist mb-3">
                  {`Fitness ${analysis.load.fitness.toFixed(0)} and fatigue ${analysis.load.fatigue.toFixed(0)} after today's riding. Form coming into today: ${analysis.load.form >= 0 ? "+" : "−"}${Math.abs(analysis.load.form).toFixed(0)}. Load measured from ${
                    analysis.load.method === "power"
                      ? "power"
                      : analysis.load.method === "hr"
                        ? "heart rate"
                        : analysis.load.method === "mixed"
                          ? "a mix of signals"
                          : "riding time only"
                  }.`}
                </p>
                <LoadChart series={analysis.load.series} />
                <p className="mt-2 text-xs text-mist leading-relaxed">
                  Form is fitness minus fatigue. Above the line (blue) you are fresh; below it
                  (red) you are carrying fatigue.
                </p>
              </Card>
              <Card>
                <h3 className="font-semibold text-text mb-1">How hard you ride</h3>
                {analysis.intensity.basis === "none" ? (
                  <p className="text-sm text-mist leading-relaxed">
                    These rides have no heart rate or power, so there is no way to tell easy from
                    hard. A heart rate strap is the cheapest upgrade a coach could ask for.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-mist mb-3">
                      Share of riding time over the last four weeks,{" "}
                      {analysis.intensity.basis === "time-in-zone"
                        ? `second by second from ${analysis.intensity.signal === "power" ? "power" : "heart rate"}`
                        : `one band per ride from its average ${analysis.intensity.signal === "power" ? "power" : "heart rate"}`}
                      .
                    </p>
                    <IntensityBar split={analysis.intensity} />
                    {analysis.intensity.signal === "hr" && !analysis.profile.maxHrTrusted && (
                      <p className="mt-2 text-xs text-amber-800 leading-relaxed">
                        Take this split with a pinch of salt. It is measured against{" "}
                        {analysis.profile.maxHr} bpm, which is{" "}
                        {analysis.profile.maxHrSource === "observed"
                          ? "only the highest heart rate in these rides"
                          : "a default, not your number"}
                        . If your true maximum is higher, more of your riding is easy than this
                        shows. Enter it below.
                      </p>
                    )}
                  </>
                )}
              </Card>
              <Card>
                <h3 className="font-semibold text-text mb-1">Days you rode</h3>
                <p className="text-xs text-mist mb-3">
                  The last eight weeks. Longest break in the last six weeks: {analysis.consistency.longestGapDays} days.
                </p>
                <RideCalendar calendar={analysis.consistency.calendar} today={analysis.today} />
              </Card>
            </div>

            {analysis.efforts.length > 0 && (
              <Card className="mt-4">
                <h3 className="font-semibold text-text mb-2">Notable efforts, last six weeks</h3>
                <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2" data-testid="coach-efforts">
                  {analysis.efforts.map((e) => (
                    <li key={e.label} className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                      <span className="min-w-0">
                        <span className="block text-sm text-text">{e.label}</span>
                        <span className="block text-xs text-mist truncate">
                          {e.rideName} · {shortDay(e.day)}
                        </span>
                      </span>
                      <span className={`${display} font-semibold text-text whitespace-nowrap`}>{e.value}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-strava">Show the weekly numbers as a table</summary>
              <div className="overflow-x-auto mt-3">
                <table className="w-full min-w-[520px] border-collapse text-sm" data-testid="coach-table">
                  <thead>
                    <tr className="text-xs text-mist text-right">
                      <th scope="col" className="py-2 pr-3 text-left font-medium">Week of</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Rides</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Time</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Miles</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Climb (ft)</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Load</th>
                      <th scope="col" className="py-2 font-medium">Cadence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.weeks.map((w) => (
                      <tr key={w.weekStart} className="border-t border-border text-right tabular-nums">
                        <th scope="row" className="py-2 pr-3 text-left font-normal text-text">
                          {shortDay(w.weekStart)}
                          {w.current ? " (so far)" : ""}
                        </th>
                        <td className="py-2 pr-3">{w.rides}</td>
                        <td className="py-2 pr-3">{hoursText(w.hours)}</td>
                        <td className="py-2 pr-3">{Math.round(w.distanceM / 1609.344)}</td>
                        <td className="py-2 pr-3">{Math.round(w.climbM * 3.28084).toLocaleString("en-US")}</td>
                        <td className="py-2 pr-3">{Math.round(w.load)}</td>
                        <td className="py-2">{w.avgCadence !== undefined ? Math.round(w.avgCadence) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        </>
      )}

      {/* ───────────── Rider numbers ───────────── */}
      <section aria-labelledby="coach-profile">
        <SectionTitle eyebrow="Optional" title="Sharpen the numbers">
          <span id="coach-profile">
            The coach works without these. With them, load and intensity stop being estimates.
            They are stored in this browser only.
          </span>
        </SectionTitle>
        <Card>
          <div className="grid gap-5 md:grid-cols-3">
            <NumberField
              label="Maximum heart rate"
              placeholder={analysis ? `${analysis.profile.maxHr} (${analysis.profile.maxHrSource === "observed" ? "highest seen" : "default"})` : "e.g. 185"}
              hint="The highest you have really seen at the end of an all-out effort. Not 220 minus your age."
              value={profile.maxHr}
              onChange={(maxHr) => updateProfile({ maxHr })}
            />
            <NumberField
              label="Resting heart rate"
              placeholder="60"
              hint="First thing in the morning, lying down."
              value={profile.restHr}
              onChange={(restHr) => updateProfile({ restHr })}
            />
            <NumberField
              label="FTP (watts)"
              placeholder="Only if you have a power meter"
              hint="The power you could hold for about an hour. Leave blank and the coach uses heart rate."
              value={profile.ftp}
              onChange={(ftp) => updateProfile({ ftp })}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
