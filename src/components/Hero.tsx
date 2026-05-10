import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center text-center overflow-hidden">
      {/* Multi-layer gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 120% 80% at 50% 80%, rgba(26,107,138,0.25) 0%, transparent 60%)",
            "radial-gradient(ellipse 100% 60% at 20% 20%, rgba(45,106,79,0.15) 0%, transparent 50%)",
            "radial-gradient(ellipse 80% 50% at 80% 30%, rgba(12,45,72,0.3) 0%, transparent 50%)",
            "linear-gradient(180deg, #0a0a0a 0%, #0d1117 40%, #0c1a2a 70%, #0a0a0a 100%)",
          ].join(", "),
        }}
      />

      {/* Wave decoration */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 1200 600' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 450 Q150 380 300 420 Q450 460 600 400 Q750 340 900 390 Q1050 440 1200 380 L1200 600 L0 600Z' fill='%23d97706' opacity='0.06'/%3E%3Cpath d='M0 480 Q200 430 400 470 Q600 510 800 440 Q1000 370 1200 430 L1200 600 L0 600Z' fill='%23f59e0b' opacity='0.04'/%3E%3C/svg%3E")`,
          backgroundPosition: "center bottom",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-[800px] px-8">
        <Image
          src="/logo-orange.png"
          alt="Cycling Hawaii Logo"
          width={120}
          height={120}
          className="mx-auto mb-8 drop-shadow-[0_0_40px_rgba(218,119,13,0.3)]"
          priority
        />

        <div className="inline-block text-xs font-semibold tracking-[0.15em] uppercase text-brand-light mb-6 px-4 py-1.5 border border-brand/30 rounded-full">
          Maui &middot; Big Island &middot; Oahu &middot; Kauai
        </div>

        <h1 className="font-[family-name:var(--font-space-grotesk)] text-[clamp(3rem,8vw,6.5rem)] font-bold tracking-tighter leading-[1.05] mb-6">
          Cycling
          <br />
          <span className="bg-gradient-to-br from-brand to-brand-light bg-clip-text text-transparent">
            Hawaii
          </span>
        </h1>

        <p className="text-lg text-mist max-w-[520px] mx-auto mb-10 font-light">
          Ride volcanic ridges, coastal highways, and jungle descents across the
          most beautiful islands on earth.
        </p>

        <a
          href="#tracker"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-br from-brand-deep to-brand text-white font-semibold text-sm rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(217,119,6,0.3)]"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="8" cy="8" r="3" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2" />
          </svg>
          Track Live Ride
        </a>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 z-10"
        style={{ animation: "float 2.5s ease-in-out infinite" }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#777"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
