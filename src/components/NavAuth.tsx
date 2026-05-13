"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Client-only auth pill. Reads the session from /api/auth/session on
// mount so the surrounding pages stay statically generated — putting
// auth() in the layout would flip every page to dynamic and kill ISR.
//
// Tradeoff: brief flash of "Sign in" before the session resolves for
// logged-in users. Acceptable for a thin nav pill; the rest of the page
// renders instantly from cache.
type SessionUser = {
  name?: string | null;
  image?: string | null;
  provider?: string;
};

export default function NavAuth() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setUser(data?.user ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Render nothing until we know — prevents the "Sign in" flash for
  // returning users. Keeps the layout stable.
  if (!loaded) return <div className="w-[60px]" />;

  if (!user) {
    return (
      <Link
        href="/signin"
        className="text-mist text-xs font-semibold uppercase tracking-widest no-underline transition-colors hover:text-strava"
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name?.[0] ?? "?").toUpperCase();

  async function handleSignOut() {
    // Hit Auth.js's signout endpoint, then full-reload so the avatar
    // disappears everywhere (cached fetches, etc.).
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
      });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <Image
          src={user.image}
          alt={user.name ?? "You"}
          width={28}
          height={28}
          className="rounded-full"
          unoptimized
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-strava text-white text-xs font-bold flex items-center justify-center">
          {initial}
        </div>
      )}
      <span className="hidden md:inline text-text text-xs font-semibold tracking-wide max-w-[120px] truncate">
        {user.name?.split(" ")[0] ?? "You"}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-mist/70 text-[0.65rem] uppercase tracking-widest hover:text-mist"
        title="Sign out"
      >
        Out
      </button>
    </div>
  );
}
