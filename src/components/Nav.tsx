"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

// `href` is an absolute path. `hash` jumps to a homepage section.
const links: { hash?: string; href?: string; label: string }[] = [
  { hash: "rides", label: "Rides" },
  { href: "/live", label: "Live Tracker" },
  { href: "/club", label: "Club" },
  { href: "/roast", label: "Roast" },
  { hash: "log", label: "Log Files" },
  { hash: "scarab", label: "Scarab" },
  { hash: "instagram", label: "Instagram" },
  { hash: "youtube", label: "YouTube" },
  { hash: "spotify", label: "Spotify" },
  { hash: "partners", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Absolute paths win. Otherwise:
  //   - On home, use #hash for smooth-scroll
  //   - On any other page (e.g. /log), use /#hash to navigate back + scroll
  const hrefFor = (link: { hash?: string; href?: string }) => {
    if (link.href) return link.href;
    return isHome ? `#${link.hash}` : `/#${link.hash}`;
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-300 ${
        scrolled
          ? "bg-bg/95 backdrop-blur-xl shadow-sm border-b border-border"
          : "bg-bg/80 backdrop-blur-sm"
      }`}
    >
      <a href="/" className="flex items-center gap-3 no-underline">
        <Image
          src="/logo-orange.png"
          alt="Cycling Hawaii"
          width={32}
          height={32}
          className="rounded-full"
          title="Aloha 🤙"
        />
        <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold tracking-tight text-text">
          CYCLING<span className="text-strava">HAWAII</span>
        </span>
      </a>

      <ul
        className={`flex list-none gap-8 md:flex ${
          menuOpen
            ? "fixed top-0 right-0 h-screen w-64 flex-col gap-6 bg-bg/98 backdrop-blur-2xl pt-20 px-8 z-50 shadow-xl border-l border-border"
            : "max-md:hidden"
        }`}
      >
        {links.map((link) => (
          <li key={link.href ?? link.hash}>
            <a
              href={hrefFor(link)}
              onClick={() => setMenuOpen(false)}
              className="text-mist text-sm font-medium uppercase tracking-widest no-underline transition-colors hover:text-text"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="relative z-[51] flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2 md:hidden"
        aria-label="Menu"
      >
        <span
          className={`block h-0.5 w-[22px] bg-text transition-all ${
            menuOpen ? "rotate-45 translate-y-[7px]" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-[22px] bg-text transition-all ${
            menuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-[22px] bg-text transition-all ${
            menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
          }`}
        />
      </button>
    </nav>
  );
}
