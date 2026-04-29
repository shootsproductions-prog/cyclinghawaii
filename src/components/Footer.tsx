import Image from "next/image";

const FOOTER_LINKS = [
  { href: "/events", label: "Events", external: false },
  { href: "/live", label: "Live Tracker", external: false },
  { href: "/#scarab", label: "Scarab", external: false },
  { href: "https://instagram.com/cyclinghawaii", label: "Instagram", external: true },
  { href: "/#youtube", label: "YouTube", external: false },
  { href: "/#spotify", label: "Spotify", external: false },
  { href: "/#partners", label: "Contact", external: false },
];

export default function Footer() {
  return (
    <footer className="pt-16 pb-12 px-6 border-t border-border bg-bg">
      <div className="max-w-[1100px] mx-auto">
        {/* Logo + wordmark */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo-orange.png"
            alt="Cycling Hawaii"
            width={40}
            height={40}
            className="mb-3"
          />
          <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg text-text">
            CYCLING<span className="text-strava">HAWAII</span>
          </div>
        </div>

        {/* Footer nav */}
        <nav className="mb-10">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 list-none">
            {FOOTER_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-mist text-xs font-medium uppercase tracking-widest no-underline transition-colors hover:text-strava"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Social icons */}
        <div className="flex items-center justify-center gap-5 mb-8">
          <a
            href="https://instagram.com/cyclinghawaii"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mist hover:text-strava transition-colors"
            aria-label="Instagram"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://www.strava.com/clubs/cyclinghawaii"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mist hover:text-strava transition-colors"
            aria-label="Strava Club"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
          </a>
          <a
            href="mailto:laura@cyclinghawaii.com"
            className="text-mist hover:text-strava transition-colors"
            aria-label="Email Laura"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 4L12 13 2 4" />
            </svg>
          </a>
        </div>

        {/* Laura email line */}
        <div className="text-center mb-3">
          <a
            href="mailto:laura@cyclinghawaii.com"
            className="text-mist text-sm hover:text-strava transition-colors"
          >
            laura@cyclinghawaii.com
          </a>
          <p className="text-mist/70 text-xs italic mt-1">
            Questions, club inquiries, custom builds — Laura reads everything.
          </p>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-mist/70 mt-6">
          &copy; {new Date().getFullYear()} Cycling Hawaii. Ride with aloha.
        </p>
      </div>
    </footer>
  );
}
