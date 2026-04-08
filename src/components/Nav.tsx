"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 transition-all duration-400 ${
        scrolled
          ? "bg-black/97 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/95 to-transparent"
      }`}
    >
      <a
        href="#"
        className="flex items-center gap-3 no-underline"
      >
        <Image
          src="/logo-white.png"
          alt="Cycling Hawaii"
          width={36}
          height={36}
          className="rounded-full"
        />
        <span className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold tracking-tight text-white">
          CYCLING<span className="text-ocean-light">HAWAII</span>
        </span>
      </a>

      {/* Desktop links */}
      <ul
        className={`flex list-none gap-8 md:flex ${
          menuOpen
            ? "fixed top-0 right-0 h-screen w-64 flex-col gap-6 bg-black/98 backdrop-blur-2xl pt-20 px-8 z-50 transition-all"
            : "max-md:hidden"
        }`}
      >
        {[
          { href: "#about", label: "About" },
          { href: "#tracker", label: "Live Tracker" },
          { href: "#instagram", label: "Instagram" },
          { href: "#strava", label: "Strava" },
          { href: "#partners", label: "Partners" },
        ].map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-mist text-sm font-medium uppercase tracking-widest no-underline transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Mobile toggle */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="relative z-[51] flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-2 md:hidden"
        aria-label="Menu"
      >
        <span
          className={`block h-0.5 w-[22px] bg-white transition-all ${
            menuOpen ? "rotate-45 translate-y-[7px]" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-[22px] bg-white transition-all ${
            menuOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-[22px] bg-white transition-all ${
            menuOpen ? "-rotate-45 -translate-y-[7px]" : ""
          }`}
        />
      </button>
    </nav>
  );
}
