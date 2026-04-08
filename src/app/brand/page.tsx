import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Guidelines — Cycling Hawaii",
  description: "Cycling Hawaii brand identity: logo usage, color palette, typography, and tone of voice.",
};

const colors = [
  { name: "Brand", var: "--color-brand", hex: "#d97706", desc: "Primary accent" },
  { name: "Brand Light", var: "--color-brand-light", hex: "#f59e0b", desc: "Hover / secondary" },
  { name: "Brand Deep", var: "--color-brand-deep", hex: "#b45309", desc: "Pressed / depth" },
  { name: "Strava", var: "--color-strava", hex: "#fc5200", desc: "Strava integration" },
  { name: "Black", var: "--color-black", hex: "#0a0a0a", desc: "Primary background" },
  { name: "Volcanic", var: "--color-volcanic", hex: "#1a1a1a", desc: "Section background" },
  { name: "Basalt", var: "--color-basalt", hex: "#252525", desc: "Card background" },
  { name: "White", var: "--color-white", hex: "#f0f0f0", desc: "Primary text" },
  { name: "Mist", var: "--color-mist", hex: "#b0b0b0", desc: "Body text" },
  { name: "Ash", var: "--color-ash", hex: "#777777", desc: "Muted text" },
  { name: "Ocean Deep", var: "--color-ocean-deep", hex: "#0c2d48", desc: "Atmospheric gradient" },
  { name: "Ocean", var: "--color-ocean", hex: "#1a6b8a", desc: "Atmospheric gradient" },
];

const logos = [
  { src: "/logo-orange.png", label: "Primary", desc: "Orange on dark background", bg: "bg-black" },
  { src: "/logo-white.png", label: "Monochrome", desc: "White on dark background", bg: "bg-black" },
  { src: "/logo-orange-bg.png", label: "Inverted", desc: "White on brand background", bg: "bg-basalt" },
];

export default function BrandPage() {
  return (
    <main className="pt-28 pb-20 px-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="text-center mb-20">
        <div className="text-xs font-semibold tracking-[0.2em] uppercase text-brand mb-3">
          Brand Guidelines
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Cycling Hawaii
        </h1>
        <p className="text-mist max-w-md mx-auto">
          Identity guidelines for consistent brand representation across all touchpoints.
        </p>
      </div>

      {/* Logo Usage */}
      <section className="mb-20">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-2">Logo</h2>
        <p className="text-ash text-sm mb-8">Three variants for different contexts. Always maintain clear space around the mark.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {logos.map((logo) => (
            <div key={logo.label} className="text-center">
              <div className={`${logo.bg} rounded-2xl p-10 flex items-center justify-center border border-white/5 mb-4`}>
                <Image src={logo.src} alt={logo.label} width={120} height={120} />
              </div>
              <div className="font-semibold text-sm">{logo.label}</div>
              <div className="text-ash text-xs">{logo.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Color Palette */}
      <section className="mb-20">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-2">Color Palette</h2>
        <p className="text-ash text-sm mb-8">Warm amber-orange accents on volcanic dark backgrounds. Ocean tones reserved for atmospheric depth.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colors.map((color) => (
            <div key={color.hex} className="group">
              <div
                className="h-20 rounded-xl mb-3 border border-white/5 transition-transform group-hover:-translate-y-1"
                style={{ backgroundColor: color.hex }}
              />
              <div className="text-sm font-medium">{color.name}</div>
              <div className="text-xs text-ash font-mono">{color.hex}</div>
              <div className="text-xs text-ash mt-0.5">{color.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="mb-20">
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-2">Typography</h2>
        <p className="text-ash text-sm mb-8">Two typefaces: Space Grotesk for headings and data, Inter for body text.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-basalt rounded-2xl p-8 border border-white/5">
            <div className="text-xs text-brand font-semibold uppercase tracking-widest mb-4">Headings</div>
            <div className="font-[family-name:var(--font-space-grotesk)]">
              <div className="text-4xl font-bold mb-2">Space Grotesk</div>
              <div className="text-2xl font-semibold mb-2">Bold 700 &middot; Semibold 600</div>
              <div className="text-lg font-medium mb-4">Medium 500 &middot; Regular 400</div>
              <div className="text-xs text-ash">Used for: h1-h3, stat numbers, brand wordmark</div>
            </div>
          </div>
          <div className="bg-basalt rounded-2xl p-8 border border-white/5">
            <div className="text-xs text-brand font-semibold uppercase tracking-widest mb-4">Body</div>
            <div>
              <div className="text-2xl font-bold mb-2">Inter</div>
              <div className="text-lg font-semibold mb-1">Semibold 600</div>
              <div className="text-base font-medium mb-1">Medium 500 &middot; Regular 400</div>
              <div className="text-base font-light mb-4">Light 300</div>
              <div className="text-xs text-ash">Used for: body text, navigation, labels, descriptions</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tone of Voice */}
      <section>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold mb-2">Tone of Voice</h2>
        <p className="text-ash text-sm mb-8">How Cycling Hawaii communicates.</p>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: "Active & present", desc: "Write in active voice, present tense. \"Ride volcanic ridges\" not \"Volcanic ridges can be ridden.\"" },
            { title: "Warm but minimal", desc: "Let photography and ride data speak. Keep text concise. Every word earns its place." },
            { title: "Hawaiian, naturally", desc: "Use Hawaiian terms (aloha, mahalo) when they fit naturally. Never as decoration or tourism cliche." },
            { title: "Personal, not corporate", desc: "First person singular. This is one cyclist's journey, not a brand committee's output." },
          ].map((item) => (
            <div key={item.title} className="bg-basalt rounded-xl p-6 border border-white/5">
              <div className="font-[family-name:var(--font-space-grotesk)] font-semibold mb-2">{item.title}</div>
              <div className="text-sm text-mist leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
