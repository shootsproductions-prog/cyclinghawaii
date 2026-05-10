import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Brand — Cycling Hawaii",
  description:
    "How Cycling Hawaiʻi looks and sounds. Colors, typography, voice, visual patterns. The brand book, rendered live.",
};

export const revalidate = 86400;

export default function BrandPage() {
  return (
    <main>
      <Hero />
      <Logo />
      <Colors />
      <Typography />
      <Voice />
      <VisualPatterns />
      <Imagery />
      <Donts />
      <Footer />
    </main>
  );
}

// ───────────────────── Hero ─────────────────────
function Hero() {
  return (
    <section className="relative pt-32 pb-16 px-6 bg-gradient-to-b from-strava/10 via-bg to-bg overflow-hidden">
      <div className="max-w-[860px] mx-auto text-center">
        <div className="text-[0.7rem] md:text-xs font-semibold tracking-[0.3em] uppercase text-strava mb-4">
          Brand Book
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text leading-[0.95] mb-5">
          How we look.
          <br />
          How we<span className="text-strava"> sound.</span>
        </h1>
        <p className="text-mist text-base md:text-lg max-w-[640px] mx-auto leading-relaxed">
          The brand of Cycling Hawaiʻi, rendered live. Colors, typography,
          voice, visual patterns. The page itself is designed in the system it
          documents.
        </p>
      </div>
    </section>
  );
}

// ───────────────────── Logo ─────────────────────
function Logo() {
  return (
    <Section eyebrow="01" title="The Logo">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        The orange scarab + a tight wordmark in two weights. The icon
        references the bike Vini named Scarab. The wordmark uses Space
        Grotesk Bold with strava-orange treatment on{" "}
        <strong className="text-strava">HAWAII</strong>.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Primary lockup on light */}
        <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center justify-center min-h-[260px]">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/logo-orange.png"
              alt="Cycling Hawaii"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-text">
              CYCLING<span className="text-strava">HAWAII</span>
            </span>
          </div>
          <div className="text-[0.6rem] uppercase tracking-widest text-mist">
            Primary lockup · Light background
          </div>
        </div>

        {/* Reversed on dark */}
        <div className="bg-text border border-text rounded-2xl p-10 flex flex-col items-center justify-center min-h-[260px]">
          <div className="flex items-center gap-3 mb-6">
            <Image
              src="/logo-orange.png"
              alt="Cycling Hawaii"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-white">
              CYCLING<span className="text-strava">HAWAII</span>
            </span>
          </div>
          <div className="text-[0.6rem] uppercase tracking-widest text-white/60">
            Reversed · Dark background
          </div>
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-4">
        <Rule title="Clear space" detail="Minimum padding around the logo equals the height of the icon." />
        <Rule title="Minimum size" detail="Wordmark legible down to ~120px wide. Below that, use the icon alone." />
        <Rule title="What not to do" detail="Don't recolor the icon, stretch the wordmark, or split the lockup." />
      </div>

      <Note>
        Variants in progress — vertical lockup, monochrome, single-color print
        files, and full SVG asset pack will be added before next sponsor pitch.
      </Note>
    </Section>
  );
}

function Rule({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-1.5">
        {title}
      </div>
      <p className="text-mist text-sm leading-relaxed">{detail}</p>
    </div>
  );
}

// ───────────────────── Colors ─────────────────────
const PALETTE_CORE = [
  {
    name: "Strava Orange",
    hex: "#fc5200",
    role: "Primary accent · Identity color",
    cssToken: "strava",
  },
  {
    name: "Amber Brown",
    hex: "#b45309",
    role: "Secondary accent · Editorial highlights",
    cssToken: "brand",
  },
  {
    name: "Text Black",
    hex: "#1a1a1a",
    role: "Primary text",
    cssToken: "text",
  },
  {
    name: "Mist Gray",
    hex: "#666666",
    role: "Body copy · Supporting",
    cssToken: "mist",
  },
  {
    name: "Surface",
    hex: "#f5f5f5",
    role: "Section alternation",
    cssToken: "surface",
  },
  {
    name: "Card",
    hex: "#ffffff",
    role: "Elevated surfaces",
    cssToken: "card",
  },
  {
    name: "Border",
    hex: "#e5e5e5",
    role: "Dividers · Inputs",
    cssToken: "border",
  },
];

const PALETTE_ACCENTS = [
  { name: "Road", hex: "#fc5200" },
  { name: "Gravel", hex: "#b45309" },
  { name: "MTB", hex: "#059669" },
  { name: "Indoor", hex: "#7c3aed" },
  { name: "E-Bike", hex: "#0ea5e9" },
  { name: "Charity", hex: "#a855f7" },
  { name: "Race", hex: "#dc2626" },
];

function Colors() {
  return (
    <Section eyebrow="02" title="Colors">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        Seven core tokens drive 95% of the site. The accent palette categorizes
        ride types and event categories. Strava orange is the brand{" "}
        <em>identity</em> — every dual-color title, every CTA, every eyebrow.
      </p>

      <div className="text-[0.6rem] font-bold uppercase tracking-widest text-mist mb-3">
        Core palette
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
        {PALETTE_CORE.map((c) => (
          <div
            key={c.name}
            className="bg-card border border-border rounded-xl overflow-hidden"
          >
            <div
              className="aspect-[3/2]"
              style={{ backgroundColor: c.hex }}
            />
            <div className="p-3">
              <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-sm">
                {c.name}
              </div>
              <div className="text-[0.6rem] font-mono text-mist mt-0.5">
                {c.hex}
              </div>
              <div className="text-[0.6rem] uppercase tracking-wider text-mist mt-1">
                {c.role}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-[0.6rem] font-bold uppercase tracking-widest text-mist mb-3">
        Category accents
      </div>
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {PALETTE_ACCENTS.map((c) => (
          <div
            key={c.name}
            className="bg-card border border-border rounded-lg overflow-hidden"
          >
            <div
              className="aspect-square"
              style={{ backgroundColor: c.hex }}
            />
            <div className="p-2 text-center">
              <div className="text-[0.65rem] font-bold text-text">
                {c.name}
              </div>
              <div className="text-[0.55rem] font-mono text-mist">
                {c.hex}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Note>
        For print: Strava Orange ≈ CMYK (0, 78, 100, 0). Pantone match TBD.
      </Note>
    </Section>
  );
}

// ───────────────────── Typography ─────────────────────
function Typography() {
  return (
    <Section eyebrow="03" title="Typography">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        Two fonts. Space Grotesk for everything that needs to feel built. Inter
        for everything that needs to be read. Italic is reserved for{" "}
        <em>Laura&apos;s voice</em>.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-2">
            Display · Space Grotesk
          </div>
          <div className="font-[family-name:var(--font-space-grotesk)] text-5xl font-bold text-text leading-none mb-3">
            Aa Bb 0123
          </div>
          <p className="text-mist text-xs leading-relaxed">
            Headings, hero titles, big numbers, eyebrows. Geometric, modern,
            slight tech edge. Weights used: 500, 600, 700.
          </p>
          <a
            href="https://fonts.google.com/specimen/Space+Grotesk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-strava text-xs font-semibold hover:underline"
          >
            Google Fonts →
          </a>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-2">
            Body · Inter
          </div>
          <div className="text-5xl font-medium text-text leading-none mb-3">
            Aa Bb 0123
          </div>
          <p className="text-mist text-xs leading-relaxed">
            Body copy, labels, paragraphs. Neutral, highly legible at all
            sizes, optical-sized for screens. Weights: 300, 400, 500, 600, 700.
          </p>
          <a
            href="https://fonts.google.com/specimen/Inter"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-strava text-xs font-semibold hover:underline"
          >
            Google Fonts →
          </a>
        </div>
      </div>

      {/* Type ladder */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
        <div className="text-[0.6rem] uppercase tracking-widest text-mist font-semibold mb-5">
          Type Ladder
        </div>
        <div className="space-y-5">
          <TypeRow
            label="Hero (h1)"
            sample={
              <span className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-6xl font-bold tracking-tight text-text leading-none">
                Just<span className="text-strava"> Ride.</span>
              </span>
            }
            spec="Space Grotesk · 700 · 5xl-8xl · tracking-tight"
          />
          <TypeRow
            label="Section (h2)"
            sample={
              <span className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text">
                Recently, together
              </span>
            }
            spec="Space Grotesk · 700 · 3xl-4xl"
          />
          <TypeRow
            label="Subhead (h3)"
            sample={
              <span className="font-[family-name:var(--font-space-grotesk)] text-xl md:text-2xl font-bold text-text">
                Meet Laura
              </span>
            }
            spec="Space Grotesk · 700 · 2xl-3xl"
          />
          <TypeRow
            label="Body"
            sample={
              <span className="text-base text-mist">
                A club for riders who love the miles and skip the lectures.
              </span>
            }
            spec="Inter · 400 · base-lg · text-mist"
          />
          <TypeRow
            label="Eyebrow"
            sample={
              <span className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava">
                The Club
              </span>
            }
            spec="Space Grotesk · 600 · 0.7rem · tracking-[0.3em] · uppercase · strava"
          />
          <TypeRow
            label="Stat"
            sample={
              <span className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-strava tabular-nums">
                10,023
              </span>
            }
            spec="Space Grotesk · 700 · 3xl-5xl · tabular-nums"
          />
          <TypeRow
            label="Laura quote"
            sample={
              <span className="text-mist text-sm italic">
                Sea level to ten thousand feet. Three hours of climbing for
                the average mortal.
              </span>
            }
            spec="Inter · 400 · italic · text-mist"
          />
        </div>
      </div>
    </Section>
  );
}

function TypeRow({
  label,
  sample,
  spec,
}: {
  label: string;
  sample: React.ReactNode;
  spec: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 md:gap-6 items-baseline">
      <div className="text-[0.6rem] uppercase tracking-widest text-mist font-semibold">
        {label}
      </div>
      <div>
        <div className="mb-1">{sample}</div>
        <div className="text-[0.55rem] font-mono text-mist/70 uppercase">
          {spec}
        </div>
      </div>
    </div>
  );
}

// ───────────────────── Voice ─────────────────────
function Voice() {
  return (
    <Section eyebrow="04" title="Voice">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        Two voices working in concert. Vini founds and signs. Laura runs the
        rest.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {/* Laura */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-2">
            Laura · Editorial voice
          </div>
          <p className="text-text text-sm leading-relaxed mb-5">
            Third person about Vini. Dry. Witty. Unimpressed by default.
            Sparingly impressed. Roasts with love. Specific data over
            generalities. AI bookkeeper energy.
          </p>
          <Sample
            kind="do"
            text="Sea level to 10,023 feet. Gradients to 18%. Three hours of climbing for the average mortal. This is the climb that decides who you are as a cyclist."
          />
          <Sample
            kind="do"
            text="Vini holds the yellow jersey, polka dot, green, and white. Statistically impressive. Embarrassingly alone."
          />
          <Sample
            kind="dont"
            text="Wow! Such an amazing ride from our incredible founder! 🚴‍♂️🌺 #cyclinghawaii"
          />
        </div>

        {/* Vini */}
        <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
          <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-2">
            Vini · Founder voice
          </div>
          <p className="text-text text-sm leading-relaxed mb-5">
            First person. Humble. Irreverent. Maui-rooted. Hawaiian language
            sprinkled (
            <em>mahalo</em>, <em>e komo mai</em>, <em>ʻāina</em>,{" "}
            <em>pono</em>). Three short clauses → one punchline.
          </p>
          <Sample
            kind="do"
            text="I ride bikes — same as a lot of people. It keeps things simple, it's good for you, and on the days I don't feel like going, that's usually when I need to most."
          />
          <Sample
            kind="do"
            text="No team kit, no drop rides, no podiums — and the audacity to call it a club."
          />
          <Sample
            kind="dont"
            text="As a passionate Hawaii-based cyclist with over 10 years of experience, I am thrilled to share my journey..."
          />
        </div>
      </div>

      {/* Voice rules */}
      <div className="bg-strava/5 border-l-2 border-strava p-6 rounded-r-xl">
        <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-3">
          Brand-Wide Voice Rules
        </div>
        <ul className="text-text text-sm leading-relaxed space-y-2">
          <li>
            • <strong>Em-dash for the punchline.</strong> Three short clauses,
            then the wink. <em>"Just miles, weather, and the audacity..."</em>
          </li>
          <li>
            • <strong>Specifics over generalities.</strong> &ldquo;94 mi at
            6,626 ft&rdquo; beats &ldquo;a hard ride.&rdquo;
          </li>
          <li>
            • <strong>Italics signal Laura.</strong> If it&apos;s in italics,
            she&apos;s saying it.
          </li>
          <li>
            • <strong>Sprinkle, don&apos;t saturate Hawaiian.</strong>{" "}
            <em>Mahalo</em> in the right place beats <em>aloha</em>{" "}
            sprinkled everywhere.
          </li>
          <li>
            • <strong>Never hype.</strong> Cycling is the baseline, not the
            achievement.
          </li>
        </ul>
      </div>
    </Section>
  );
}

function Sample({ kind, text }: { kind: "do" | "dont"; text: string }) {
  const isDo = kind === "do";
  return (
    <div
      className={`mb-3 last:mb-0 px-4 py-3 rounded-lg border-l-2 text-xs italic leading-relaxed ${
        isDo
          ? "bg-emerald-500/5 border-emerald-500/40 text-text"
          : "bg-red-500/5 border-red-500/40 text-mist"
      }`}
    >
      <span
        className={`inline-block text-[0.55rem] font-bold uppercase tracking-widest not-italic mr-2 ${
          isDo ? "text-emerald-700" : "text-red-600"
        }`}
      >
        {isDo ? "✓ Do" : "✗ Don't"}
      </span>
      {text}
    </div>
  );
}

// ───────────────────── Visual Patterns ─────────────────────
function VisualPatterns() {
  return (
    <Section eyebrow="05" title="Visual Patterns">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        Five recurring patterns make every page recognizable as Cycling
        Hawaiʻi, regardless of content.
      </p>

      {/* Dual-color title */}
      <Pattern
        name="Dual-color hero title"
        rule="The defining noun (or verb) gets strava-orange. Bold black for context, orange for identity. Used on every hub-page hero."
      >
        <div className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text">
          Maui<span className="text-strava"> Routes</span>
        </div>
      </Pattern>

      {/* Eyebrow */}
      <Pattern
        name="Strava-orange eyebrow"
        rule="Above every section title. Uppercase, letter-spacing 0.3em, strava color. Sets context before the headline."
      >
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava">
          The Club
        </div>
      </Pattern>

      {/* Hero gradient */}
      <Pattern
        name="Soft strava-tinted hero gradient"
        rule="from-strava/10 → bg → bg, vertical. Used on every hub page. Warms the page without overwhelming."
      >
        <div className="h-32 rounded-xl bg-gradient-to-b from-strava/10 via-bg to-bg border border-border" />
      </Pattern>

      {/* Em-dash */}
      <Pattern
        name="Em-dash punchline"
        rule="List three short clauses, then em-dash, then the wink clause."
      >
        <p className="text-text text-base">
          Miles, weather, rainbows, coffee tours{" "}
          <span className="text-strava font-bold">—</span> and the audacity to
          call it a club.
        </p>
      </Pattern>

      {/* Chips */}
      <Pattern
        name="Sport-type chips"
        rule="Pill-shaped, soft /15 background + matching text color. Categorical labels across the site."
      >
        <div className="flex flex-wrap gap-2">
          <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-strava/15 text-strava">
            Road
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#b45309]/15 text-[#b45309]">
            Gravel
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#059669]/15 text-[#059669]">
            MTB
          </span>
          <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#7c3aed]/15 text-[#7c3aed]">
            Indoor
          </span>
        </div>
      </Pattern>

      {/* Laura accent */}
      <Pattern
        name="Laura's accent block"
        rule="Italicized text, mist-gray, with a small strava-orange marker icon in a circle. Indicates Laura is speaking."
      >
        <div className="flex items-start gap-3 max-w-[480px]">
          <div className="w-8 h-8 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-0.5">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#fc5200"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-strava mb-1">
              Laura&apos;s Read
            </div>
            <p className="text-mist text-sm italic leading-relaxed">
              Trades are honking. Tailwind toward Hāna — go take the bait.
            </p>
          </div>
        </div>
      </Pattern>
    </Section>
  );
}

function Pattern({
  name,
  rule,
  children,
}: {
  name: string;
  rule: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 last:mb-0 grid md:grid-cols-[280px_1fr] gap-6 items-start bg-card border border-border rounded-xl p-5 md:p-6">
      <div>
        <div className="font-[family-name:var(--font-space-grotesk)] font-bold text-text text-base mb-1.5">
          {name}
        </div>
        <p className="text-mist text-xs leading-relaxed">{rule}</p>
      </div>
      <div className="md:border-l md:border-border md:pl-6 py-2">
        {children}
      </div>
    </div>
  );
}

// ───────────────────── Imagery ─────────────────────
function Imagery() {
  return (
    <Section eyebrow="06" title="Imagery">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        Photography style — the look and feel that makes a Cycling Hawaiʻi
        photo recognizable as one. Real reference imagery added after the May
        24 / 26 shoots.
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="relative aspect-[4/3] bg-surface">
            <Image
              src="/hero/welcome.jpg"
              alt="Vini riding through Maui jungle"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-5">
            <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-1.5">
              Reference: Welcome banner
            </div>
            <p className="text-mist text-xs leading-relaxed">
              Solo rider in landscape. Shallow DoF. Backlit jungle. Rider as
              part of the environment, not the focus.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="relative aspect-[4/3] bg-surface">
            <Image
              src="/bike/scarab-hero.jpg"
              alt="Scarab — Trek Checkpoint SL 7"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-5">
            <div className="text-[0.6rem] uppercase tracking-widest text-strava font-semibold mb-1.5">
              Reference: Bike portrait
            </div>
            <p className="text-mist text-xs leading-relaxed">
              Studio-clean. Warm rim light. Bike as character, not catalog
              object.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Rule
          title="Light"
          detail="Golden hour preferred. Backlit OK. Avoid harsh midday. Long shadows welcome."
        />
        <Rule
          title="Color"
          detail="Saturated warm tones. Never crushed black. Skin tones natural."
        />
        <Rule
          title="Composition"
          detail="Rider as small element vs landscape. Or shallow DoF for portraits. Avoid centered hero shots."
        />
        <Rule
          title="Mood"
          detail="Solitude, scale, texture, earned. Never aspirational or stocky."
        />
      </div>
    </Section>
  );
}

// ───────────────────── Don'ts ─────────────────────
const DONTS = [
  "Generic stock photos (anything not actually on Maui)",
  "Emojis in body copy (chips and UI labels only, sparingly)",
  "Over-explaining — let the punchline land",
  "All-lowercase pretentious branding",
  "Sans-serif italics outside of Laura's voice",
  "Logo recoloring (the orange is non-negotiable)",
  "Hype language — never say 'amazing,' 'epic,' 'legendary'",
  "Cycling clichés about 'pushing limits' or 'finding yourself'",
];

function Donts() {
  return (
    <Section eyebrow="07" title="Don'ts">
      <p className="text-mist text-base leading-relaxed mb-10 max-w-[640px]">
        The crisp list of what to avoid. The brand becomes itself by what it
        refuses, as much as what it embraces.
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {DONTS.map((d) => (
          <div
            key={d}
            className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 flex items-start gap-3"
          >
            <span className="text-red-600 font-bold text-sm shrink-0">✗</span>
            <span className="text-text text-sm leading-relaxed">{d}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ───────────────────── Footer ─────────────────────
function Footer() {
  return (
    <section className="py-16 px-6 bg-surface border-t border-border">
      <div className="max-w-[700px] mx-auto text-center">
        <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
          Living document
        </div>
        <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl md:text-3xl font-bold tracking-tight text-text mb-4">
          The brand evolves with the rides.
        </h2>
        <p className="text-mist text-sm md:text-base leading-relaxed mb-6">
          This page renders live from the codebase — change a token, the brand
          book updates. After the May 24 / 26 shoots, the imagery section
          gains real Cycling Hawaiʻi references.
        </p>
        <p className="text-mist text-xs italic">
          Designers, sponsors, collaborators — share this URL.{" "}
          <strong className="text-text">cyclinghawaii.com/brand</strong>
        </p>
      </div>
    </section>
  );
}

// ───────────────────── Reusable shell ─────────────────────
function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 md:py-20 px-6 border-b border-border">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-12">
          <div className="text-[0.7rem] font-semibold tracking-[0.3em] uppercase text-strava mb-3 font-mono">
            {eyebrow}
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-5xl font-bold tracking-tight text-text leading-tight">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 px-5 py-3 bg-mist/5 border-l-2 border-mist/30 rounded-r-lg text-mist text-xs italic leading-relaxed">
      <span className="font-semibold not-italic mr-2">Note:</span>
      {children}
    </div>
  );
}
