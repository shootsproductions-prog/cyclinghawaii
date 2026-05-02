"use client";

import { useState, useEffect, useRef } from "react";

const PRESET_LINES = [
  {
    label: "Gear review opener",
    text: "Cycling traditionalists hate phones on bars. Vini does it anyway and won't apologize.",
  },
  {
    label: "Tour stage announcement",
    text: "Stage seven. The Queen Stage. Sea level to ten thousand feet. If you're not ready, don't start. If you start, finish.",
  },
  {
    label: "Event hype",
    text: "Aloha Gravel is in ninety days. Lap-based gravel, no podiums, no excuses. The audacity to call it a club.",
  },
  {
    label: "Manifesto excerpt",
    text: "No team kit. No drop rides. No podiums. And the audacity to call it a club. We don't take this too seriously.",
  },
];

const LS_KEY = "cyclinghawaii_admin_pw";

export default function LauraVoicePage() {
  const [authPassword, setAuthPassword] = useState<string | null>(null);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved password from localStorage on mount (so you don't have
  // to retype it after every page reload — it's only stored locally).
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) setAuthPassword(saved);
  }, []);

  // Cleanup any blob URL when a new audio is generated or on unmount.
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!pwInput) return;

    // Quick validation against server with empty body — if password
    // accepted (but text empty), server returns 400; if password wrong,
    // returns 401.
    setPwError(null);
    try {
      const res = await fetch("/api/admin/laura-voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwInput, text: "" }),
      });
      if (res.status === 401) {
        setPwError("Wrong password. Try again.");
        return;
      }
      // 400 (no text) or anything else means password was accepted
      setAuthPassword(pwInput);
      localStorage.setItem(LS_KEY, pwInput);
    } catch {
      setPwError("Network error. Try again.");
    }
  }

  async function handleGenerate() {
    if (!authPassword || !text.trim()) return;
    setBusy(true);
    setError(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const res = await fetch("/api/admin/laura-voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPassword, text }),
      });

      if (res.status === 401) {
        // Password might've changed — force re-auth.
        localStorage.removeItem(LS_KEY);
        setAuthPassword(null);
        setError("Session expired. Re-enter password.");
        return;
      }

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setError(
          errBody.error ?? `Generation failed (${res.status})`
        );
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Auto-play once ready
      setTimeout(() => audioRef.current?.play().catch(() => {}), 200);
    } catch (err) {
      console.error(err);
      setError("Network error generating audio.");
    } finally {
      setBusy(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem(LS_KEY);
    setAuthPassword(null);
    setAudioUrl(null);
    setText("");
    setPwInput("");
  }

  // ─── Auth gate ────────────────────────────────────────
  if (!authPassword) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center px-6 bg-gradient-to-b from-strava/10 via-bg to-bg">
        <div className="w-full max-w-[420px] bg-card border border-border rounded-2xl p-8 shadow-md">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-2 text-center">
            Admin
          </div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-text mb-6 text-center">
            Laura&apos;s Voice
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
          <p className="text-mist text-xs italic mt-6 text-center">
            Hidden tool. Don&apos;t share the URL.
          </p>
        </div>
      </main>
    );
  }

  // ─── Main UI ──────────────────────────────────────────
  const charCount = text.length;
  const overLimit = charCount > 5000;

  return (
    <main className="min-h-[100dvh] pt-28 pb-16 px-6 bg-bg">
      <div className="max-w-[760px] mx-auto">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-3 text-center">
          Admin · Laura&apos;s Voice Studio
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text mb-3 text-center leading-tight">
          Type. Generate.<span className="text-strava"> Roast.</span>
        </h1>
        <p className="text-mist text-sm md:text-base italic text-center mb-10 max-w-[520px] mx-auto">
          Paste a script. Get an MP3 in Laura&apos;s voice. Drop it into Final
          Cut. Make videos.
        </p>

        {/* Quick-fill presets */}
        <div className="mb-4">
          <div className="text-[0.6rem] uppercase tracking-widest text-mist mb-2 font-semibold">
            Quick-fill
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_LINES.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setText(p.text)}
                className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-strava hover:text-strava text-text transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-4 shadow-sm">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste Laura's script here. She'll deliver it in her usual dry, sarcastic register."
            rows={8}
            className="w-full bg-transparent text-text text-base leading-relaxed placeholder:text-mist/60 focus:outline-none resize-y"
          />
          <div className="flex items-center justify-between border-t border-border pt-3 mt-3 text-[0.65rem] uppercase tracking-widest text-mist">
            <span className={overLimit ? "text-red-600 font-semibold" : ""}>
              {charCount} / 5000 chars
            </span>
            <span className="italic normal-case tracking-normal">
              ~{Math.ceil(charCount / 14)} sec at Laura&apos;s pace
            </span>
          </div>
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy || !text.trim() || overLimit}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-strava text-white font-semibold text-sm uppercase tracking-wider hover:bg-strava/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-strava/20"
          >
            {busy ? "Generating..." : "Generate Audio"}
            {!busy && (
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
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setText("");
              if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
              }
              setError(null);
            }}
            className="text-xs uppercase tracking-widest text-mist hover:text-text"
          >
            Clear
          </button>

          <span className="ml-auto text-xs text-mist italic">
            Voice ID: <code>aMSt68OGf4xUZAnLpTU8</code>
          </span>
        </div>

        {error && (
          <div className="mb-6 px-5 py-3 bg-red-500/5 border border-red-500/30 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Audio player + download */}
        {audioUrl && (
          <div className="bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
            <div className="text-[0.65rem] font-semibold tracking-widest uppercase text-strava mb-3">
              Result
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full mb-4"
            />
            <a
              href={audioUrl}
              download={`laura-${Date.now()}.mp3`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-card border border-border text-text font-semibold text-xs uppercase tracking-wider hover:border-strava hover:text-strava transition-colors"
            >
              Download MP3
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path d="M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3M16 11l-4 4-4-4M12 15V3" />
              </svg>
            </a>
          </div>
        )}

        {/* Sign-out */}
        <div className="text-center mt-12">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-mist/70 text-xs italic hover:text-mist underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
