"use client";

// The bike fit tool. Everything it does with pictures happens in this
// browser tab: decoding, pose detection, measuring, storing. No image
// or video is ever uploaded.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Callout, Card, SectionTitle, buttonClass } from "@/components/ToolUi";
import { analyzeSession } from "@/lib/fit/analyze";
import { frameFromCanvas, frameFromImageFile } from "@/lib/fit/image";
import { FRAMES, FRAME_ORDER, missingRequired } from "@/lib/fit/landmarks";
import { DEFAULT_CRANK_LENGTH_MM, STYLES } from "@/lib/fit/ranges";
import {
  buildExport,
  deleteSession,
  listSessions,
  newSessionId,
  parseExport,
  saveSession,
} from "@/lib/fit/storage";
import type {
  CaptureMode,
  FitSession,
  FrameData,
  FrameKind,
  LandmarkId,
  Landmarks,
  RidingStyle,
  SessionSettings,
} from "@/lib/fit/types";
import FitResults from "./FitResults";
import FrameView from "./FrameView";
import LandmarkEditor from "./LandmarkEditor";
import SessionCompare from "./SessionCompare";
import VideoPicker from "./VideoPicker";
import { buildSampleFrames } from "./sample";

type Frames = Partial<Record<FrameKind, FrameData>>;

const INITIAL_SETTINGS: SessionSettings = {
  style: "endurance",
  captureMode: "pedalling",
  crankLengthMm: DEFAULT_CRANK_LENGTH_MM,
  crankLengthConfirmed: false,
  tiltDeg: 0,
};

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function FitTool() {
  const [settings, setSettings] = useState<SessionSettings>(INITIAL_SETTINGS);
  const [frames, setFrames] = useState<Frames>({});
  const [activeKind, setActiveKind] = useState<FrameKind>("bottom");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<FitSession[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [includeImages, setIncludeImages] = useState(true);
  const [poseLoaded, setPoseLoaded] = useState(false);
  const [notice, setNotice] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [working, setWorking] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const analysis = useMemo(() => analyzeSession({ frames, settings }), [frames, settings]);

  const refreshSessions = useCallback(async () => {
    try {
      setSessions(await listSessions());
    } catch (error) {
      setNotice({
        tone: "bad",
        text:
          error instanceof Error
            ? `Saved sessions are unavailable: ${error.message}`
            : "Saved sessions are unavailable in this browser.",
      });
    }
  }, []);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  const fail = (error: unknown, fallback: string) =>
    setNotice({ tone: "bad", text: error instanceof Error ? error.message : fallback });

  // ── Frames ─────────────────────────────────────────────────────

  const putFrame = (kind: FrameKind, frame: FrameData) => {
    setFrames((prev) => ({ ...prev, [kind]: frame }));
    setActiveKind(kind);
    setNotice(null);
  };

  const onPhoto = async (kind: FrameKind, file: File | undefined) => {
    if (!file) return;
    setWorking("Opening the photo…");
    try {
      const { frame } = await frameFromImageFile(file, kind);
      putFrame(kind, frame);
    } catch (error) {
      fail(error, "Could not open that photo.");
    } finally {
      setWorking(null);
    }
  };

  const onVideoCapture = async (kind: FrameKind, canvas: HTMLCanvasElement) => {
    putFrame(kind, await frameFromCanvas(canvas, kind, "video"));
  };

  const onLandmarks = useCallback(
    (kind: FrameKind, landmarks: Landmarks, autoPlaced: LandmarkId[]) => {
      setFrames((prev) => {
        const frame = prev[kind];
        if (!frame) return prev;
        return { ...prev, [kind]: { ...frame, landmarks, autoPlaced } };
      });
    },
    []
  );

  const removeFrame = (kind: FrameKind) =>
    setFrames((prev) => {
      const next = { ...prev };
      delete next[kind];
      return next;
    });

  const loadSample = async () => {
    setWorking("Drawing the sample rider…");
    try {
      setFrames(await buildSampleFrames());
      setSettings((s) => ({ ...s, crankLengthMm: DEFAULT_CRANK_LENGTH_MM, crankLengthConfirmed: true, tiltDeg: 0 }));
      setActiveKind("bottom");
      setDraftId(null);
      setLabel("Sample rider");
      setVideoFile(null);
      setNotice({
        tone: "good",
        text: "Sample rider loaded with every point placed. Drag a point and watch the angles and the advice change.",
      });
    } catch (error) {
      fail(error, "Could not build the sample rider.");
    } finally {
      setWorking(null);
    }
  };

  const startOver = () => {
    setFrames({});
    setVideoFile(null);
    setLabel("");
    setChangeNote("");
    setDraftId(null);
    setActiveKind("bottom");
    setNotice(null);
  };

  // ── Sessions ───────────────────────────────────────────────────

  const hasFrames = Object.keys(frames).length > 0;
  const hasMeasurements = analysis.findings.length > 0;

  const save = async (asNew: boolean) => {
    const now = new Date().toISOString();
    const existing = !asNew && draftId ? sessions.find((s) => s.id === draftId) : undefined;
    const session: FitSession = {
      id: existing?.id ?? newSessionId(),
      createdAt: existing?.createdAt ?? now,
      label: label.trim() || `Fit check, ${shortDate(now)}`,
      ...(changeNote.trim() ? { changeNote: changeNote.trim() } : {}),
      settings,
      frames,
    };
    try {
      await saveSession(session);
      setDraftId(session.id);
      setLabel(session.label);
      await refreshSessions();
      setNotice({
        tone: "good",
        text: "Saved on this device. Make the change, ride, then start a new session and compare.",
      });
    } catch (error) {
      fail(error, "Could not save. The browser may be out of storage or in private mode.");
    }
  };

  const openSession = (session: FitSession) => {
    setFrames(session.frames);
    setSettings(session.settings);
    setLabel(session.label);
    setChangeNote(session.changeNote ?? "");
    setDraftId(session.id);
    setVideoFile(null);
    setActiveKind(FRAME_ORDER.find((k) => session.frames[k]) ?? "bottom");
    setNotice(null);
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const remove = async (session: FitSession) => {
    if (!window.confirm(`Delete "${session.label}" from this device? This cannot be undone.`)) return;
    try {
      await deleteSession(session.id);
      setCompareIds((ids) => ids.filter((id) => id !== session.id));
      if (draftId === session.id) setDraftId(null);
      await refreshSessions();
    } catch (error) {
      fail(error, "Could not delete that session.");
    }
  };

  const toggleCompare = (id: string) =>
    setCompareIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-2)));

  const exportAll = () => {
    const file = buildExport(sessions, { includeImages });
    download(`cyclinghawaii-fit-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(file));
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const imported = parseExport(await file.text());
      if (imported.length === 0) throw new Error("That file has no fit sessions in it.");
      for (const session of imported) await saveSession(session);
      await refreshSessions();
      setNotice({ tone: "good", text: `Imported ${imported.length} session${imported.length === 1 ? "" : "s"}.` });
    } catch (error) {
      fail(error, "Could not import that file.");
    }
  };

  // Older session first, whichever order they were ticked in.
  const comparePair = compareIds
    .map((id) => sessions.find((s) => s.id === id))
    .filter((s): s is FitSession => !!s)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const active = frames[activeKind];

  return (
    <div className="space-y-14">
      {/* ───────────── Session settings ───────────── */}
      <section aria-labelledby="fit-settings">
        <SectionTitle eyebrow="Step 2" title="Tell the coach how you ride">
          <span id="fit-settings">
            The saddle targets are the same for everyone. Riding style changes how low and how
            long the front end should be.
          </span>
        </SectionTitle>
        <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Riding style">
          {(Object.keys(STYLES) as RidingStyle[]).map((style) => {
            const on = settings.style === style;
            return (
              <button
                key={style}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSettings((s) => ({ ...s, style }))}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  on ? "border-strava bg-strava/5" : "border-border bg-card hover:border-text/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-text">{STYLES[style].label}</span>
                  {on && <Badge tone="good">Selected</Badge>}
                </div>
                <p className="mt-1 text-sm text-mist leading-snug">{STYLES[style].blurb}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <fieldset>
              <legend className="font-semibold text-text mb-2">How were the frames taken?</legend>
              {(
                [
                  ["pedalling", "While pedalling", "A video frame or an action photo. Knee target 30 to 40°."],
                  ["static", "Posed and still", "Stopped with the pedal held in place. Knee target 25 to 35°."],
                ] as [CaptureMode, string, string][]
              ).map(([mode, title, help]) => (
                <label key={mode} className="flex items-start gap-3 py-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="capture-mode"
                    className="mt-1 accent-strava"
                    checked={settings.captureMode === mode}
                    onChange={() => setSettings((s) => ({ ...s, captureMode: mode }))}
                  />
                  <span>
                    <span className="text-sm font-medium text-text">{title}</span>
                    <span className="block text-xs text-mist leading-snug">{help}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          </Card>
          <Card>
            <label htmlFor="crank-length" className="font-semibold text-text block mb-2">
              Crank length
            </label>
            <div className="flex items-center gap-2">
              <input
                id="crank-length"
                type="number"
                inputMode="decimal"
                min={140}
                max={200}
                step={2.5}
                value={settings.crankLengthMm}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isFinite(value) && value > 0) {
                    setSettings((s) => ({ ...s, crankLengthMm: value, crankLengthConfirmed: true }));
                  }
                }}
                className="w-28 rounded-lg border border-border bg-bg px-3 py-2 text-text tabular-nums"
              />
              <span className="text-sm text-mist">mm</span>
              {settings.crankLengthConfirmed ? (
                <Badge tone="good">Confirmed</Badge>
              ) : (
                <button
                  type="button"
                  className="text-xs font-semibold text-strava"
                  onClick={() => setSettings((s) => ({ ...s, crankLengthConfirmed: true }))}
                >
                  That is right
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-mist leading-relaxed">
              This is the ruler. The length is stamped on the inside of the crank arm (usually 165
              to 175). Mark the crank centre and pedal axle on a frame and every recommendation
              comes out in millimetres.
            </p>
          </Card>
        </div>
      </section>

      {/* ───────────── Frames ───────────── */}
      <section aria-labelledby="fit-frames" ref={editorRef} className="scroll-mt-24">
        <SectionTitle eyebrow="Step 3" title="Add your frames and mark the joints">
          <span id="fit-frames">
            One video gives you all three frames. The bottom of the stroke is the one that
            matters most; add the others when you can.
          </span>
        </SectionTitle>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <label className={buttonClass("primary")}>
            Load a video
            <input
              type="file"
              accept="video/*"
              className="sr-only"
              data-testid="video-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setVideoFile(file);
                e.target.value = "";
              }}
            />
          </label>
          <Button variant="ghost" onClick={() => void loadSample()} data-testid="load-sample">
            Try the sample rider
          </Button>
          {hasFrames && (
            <Button variant="ghost" onClick={startOver}>
              Start a new session
            </Button>
          )}
          {working && <span className="text-sm text-mist" aria-live="polite">{working}</span>}
        </div>

        {notice && (
          <div className="mb-4" data-testid="notice" role="status">
            <Callout tone={notice.tone}>{notice.text}</Callout>
          </div>
        )}

        {videoFile && (
          <Card className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-mist mb-3">
              Pick frames from your video
            </div>
            <VideoPicker
              file={videoFile}
              captured={{ bottom: !!frames.bottom, forward: !!frames.forward, top: !!frames.top }}
              onCapture={onVideoCapture}
              onClose={() => setVideoFile(null)}
            />
          </Card>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4" role="tablist" aria-label="Frames">
          {FRAME_ORDER.map((kind) => {
            const frame = frames[kind];
            const on = activeKind === kind;
            const ready = frame ? missingRequired(kind, frame.landmarks).length === 0 : false;
            return (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveKind(kind)}
                data-testid={`tab-${kind}`}
                className={`text-left rounded-xl border p-2.5 md:p-3 transition-colors ${
                  on ? "border-strava bg-strava/5" : "border-border bg-card hover:border-text/30"
                }`}
              >
                <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-mist">
                  {FRAMES[kind].clock}
                </div>
                <div className="text-sm font-semibold text-text leading-tight mt-0.5">
                  {FRAMES[kind].title}
                </div>
                <div className="mt-1.5">
                  {!frame ? (
                    <Badge>Empty</Badge>
                  ) : ready ? (
                    <Badge tone="good">Ready</Badge>
                  ) : (
                    <Badge tone="warn">Mark points</Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <Card className="!p-3 md:!p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <div>
              <div className="font-semibold text-text">
                {FRAMES[activeKind].title} <span className="text-mist font-normal">· {FRAMES[activeKind].clock}</span>
              </div>
              <div className="text-xs text-mist">Used for: {FRAMES[activeKind].measures}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className={buttonClass(active ? "ghost" : "accent", "sm")}>
                {active ? "Replace photo" : "Add a photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  data-testid={`photo-input-${activeKind}`}
                  onChange={(e) => {
                    void onPhoto(activeKind, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {active && (
                <Button variant="ghost" size="sm" onClick={() => removeFrame(activeKind)}>
                  Remove
                </Button>
              )}
            </div>
          </div>

          {active ? (
            <LandmarkEditor
              key={`${activeKind}-${active.image?.byteLength ?? 0}-${active.width}`}
              frame={active}
              analysis={analysis}
              tiltDeg={settings.tiltDeg}
              onTiltChange={(tiltDeg) => setSettings((s) => ({ ...s, tiltDeg }))}
              onChange={(landmarks, autoPlaced) => onLandmarks(activeKind, landmarks, autoPlaced)}
              autoDetect={poseLoaded}
              onPoseLoaded={() => setPoseLoaded(true)}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface px-5 py-10 text-center">
              <p className="text-text font-medium mb-1">No {FRAMES[activeKind].clock} frame yet.</p>
              <p className="text-sm text-mist max-w-[46ch] mx-auto leading-relaxed">
                {FRAMES[activeKind].pick} Load a video above and step to it, or add a photo.
              </p>
            </div>
          )}
        </Card>
      </section>

      {/* ───────────── Results ───────────── */}
      <section aria-labelledby="fit-read">
        <SectionTitle eyebrow="Step 4" title="One change at a time">
          <span id="fit-read">
            Saddle height first, then fore-aft, then reach and bar height. Each change moves the
            ones after it, so you get one thing to do, then you shoot again.
          </span>
        </SectionTitle>
        <FitResults analysis={analysis} settings={settings} />
      </section>

      {/* ───────────── Save ───────────── */}
      <section aria-labelledby="fit-save">
        <SectionTitle eyebrow="Step 5" title="Save it, change one thing, shoot again">
          <span id="fit-save">
            Sessions are stored in this browser on this device. Nothing is sent to a server.
          </span>
        </SectionTitle>
        <Card>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-text">Name this session</span>
              <input
                type="text"
                value={label}
                maxLength={120}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Before raising the saddle"
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-text"
                data-testid="session-label"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-text">What did you change since last time?</span>
              <input
                type="text"
                value={changeNote}
                maxLength={500}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Saddle up 5 mm"
                className="mt-1 w-full rounded-lg border border-border bg-bg px-3 py-2 text-text"
                data-testid="session-note"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              variant="accent"
              onClick={() => void save(false)}
              disabled={!hasMeasurements}
              data-testid="save-session"
            >
              {draftId ? "Update saved session" : "Save session"}
            </Button>
            {draftId && (
              <Button variant="ghost" onClick={() => void save(true)} disabled={!hasMeasurements}>
                Save as a new session
              </Button>
            )}
            {!hasMeasurements && (
              <span className="text-sm text-mist">Mark the joints on at least one frame first.</span>
            )}
          </div>
        </Card>

        <div className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <h3 className="font-semibold text-text">
              Saved on this device{" "}
              <span className="text-mist font-normal">({sessions.length})</span>
            </h3>
            {sessions.length >= 2 && (
              <span className="text-sm text-mist">Tick two sessions to compare them.</span>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-mist">
              Nothing saved yet. Your first saved session becomes the &quot;before&quot; picture.
            </p>
          ) : (
            <ul className="space-y-2" data-testid="session-list">
              {sessions.map((session) => {
                const firstKind = FRAME_ORDER.find((k) => session.frames[k]);
                const ticked = compareIds.includes(session.id);
                const sessionAnalysis = analyzeSession(session);
                return (
                  <li
                    key={session.id}
                    className={`rounded-xl border bg-card p-3 flex gap-3 items-start ${
                      ticked ? "border-strava" : "border-border"
                    }`}
                    data-session={session.id}
                  >
                    <div className="w-24 shrink-0">
                      {firstKind && <FrameView frame={session.frames[firstKind]!} displayWidth={96} compact />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-text truncate">{session.label}</div>
                      <div className="text-xs text-mist">
                        {new Date(session.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        · {STYLES[session.settings.style].label}
                      </div>
                      <div className="text-sm text-text/80 mt-1 leading-snug">{sessionAnalysis.plan.headline}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <label className="inline-flex items-center gap-1.5 text-sm text-text cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-strava w-4 h-4"
                            checked={ticked}
                            onChange={() => toggleCompare(session.id)}
                            data-testid="compare-tick"
                          />
                          Compare
                        </label>
                        <button type="button" className="text-sm font-semibold text-strava" onClick={() => openSession(session)}>
                          Open
                        </button>
                        <button type="button" className="text-sm text-mist hover:text-red-700" onClick={() => void remove(session)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {comparePair.length === 2 && (
            <div className="mt-5">
              <SessionCompare before={comparePair[0]} after={comparePair[1]} />
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button variant="ghost" size="sm" onClick={exportAll} disabled={sessions.length === 0} data-testid="export-sessions">
              Export sessions
            </Button>
            <label className="inline-flex items-center gap-1.5 text-sm text-mist cursor-pointer">
              <input
                type="checkbox"
                className="accent-strava"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
              />
              include photos
            </label>
            <label className={buttonClass("ghost", "sm")}>
              Import sessions
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                data-testid="import-sessions"
                onChange={(e) => {
                  void importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-mist leading-relaxed max-w-[70ch]">
            Export writes a file to your device so you can back sessions up or move them to
            another browser. Clearing this site&apos;s data in your browser deletes saved sessions.
          </p>
        </div>
      </section>
    </div>
  );
}
