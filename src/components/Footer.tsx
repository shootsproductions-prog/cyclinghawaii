import Image from "next/image";

export default function Footer() {
  return (
    <footer className="py-12 px-8 text-center border-t border-white/5">
      <Image
        src="/logo-white.png"
        alt="Cycling Hawaii"
        width={48}
        height={48}
        className="mx-auto mb-4 opacity-60"
      />
      <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg mb-3">
        CYCLING<span className="text-brand">HAWAII</span>
      </div>

      {/* Social links */}
      <div className="flex items-center justify-center gap-5 mb-4">
        <a
          href="https://instagram.com/cyclinghawaii"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ash hover:text-brand transition-colors"
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
          className="text-ash hover:text-brand transition-colors"
          aria-label="Strava"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
        </a>
        <a
          href="mailto:hello@cyclinghawaii.com"
          className="text-ash hover:text-brand transition-colors"
          aria-label="Email"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 4L12 13 2 4" />
          </svg>
        </a>
      </div>

      <p className="text-sm text-ash">
        &copy; {new Date().getFullYear()} Cycling Hawaii. Ride with aloha.
      </p>
    </footer>
  );
}
