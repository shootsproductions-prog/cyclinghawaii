import Image from "next/image";
import fs from "fs";
import path from "path";
import SectionHeader from "./SectionHeader";

const specs = [
  { label: "Frame", value: "Trek Checkpoint SL 7 Gen 3" },
  { label: "Material", value: "OCLV Carbon" },
  { label: "Drivetrain", value: "SRAM Force AXS 1×12" },
  { label: "Gearing", value: "40T × 10–44T" },
  { label: "Wheels", value: "Bontrager Aeolus Elite Carbon" },
  { label: "Tires", value: "Panaracer GravelKing 45mm Tubeless" },
  { label: "Brakes", value: "SRAM Hydraulic Disc" },
  { label: "Status", value: "Spoiled" },
];

// Check which photo format exists at build time — JPG if uploaded, SVG placeholder otherwise
function getBikePhoto(name: string): string {
  const publicDir = path.join(process.cwd(), "public", "bike");
  const extensions = ["jpg", "jpeg", "png", "webp", "svg"];
  for (const ext of extensions) {
    if (fs.existsSync(path.join(publicDir, `${name}.${ext}`))) {
      return `/bike/${name}.${ext}`;
    }
  }
  return `/bike/${name}.svg`;
}

export default function Scarab() {
  const heroPhoto = getBikePhoto("scarab-hero");
  const grid = Array.from({ length: 9 }, (_, i) =>
    getBikePhoto(`scarab-grid-${i + 1}`)
  );

  return (
    <section id="scarab" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="The Bike"
        title="Meet Scarab"
        description="She has a name, a personality, and an unreasonable amount of carbon."
      />

      <div className="max-w-[1000px] mx-auto">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-8 items-center mb-8">
          {/* Hero photo */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
            <Image
              src={heroPhoto}
              alt="Scarab — Trek Checkpoint SL6"
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Specs */}
          <div>
            <div className="space-y-3 mb-6">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-baseline justify-between border-b border-border pb-2"
                >
                  <span className="text-xs text-mist uppercase tracking-wider">
                    {spec.label}
                  </span>
                  <span className="text-sm font-semibold text-text">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-mist leading-relaxed italic">
              Named after the beetle, built like a tank, rolls like a dream.
              Scarab has taken Vini up volcanoes, down coastlines, and through
              rain he probably should&apos;ve avoided. She never complains.
              He can&apos;t say the same.
            </p>
          </div>
        </div>

        {/* 3x3 photo grid */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {grid.map((src, i) => (
            <div
              key={i}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-card"
            >
              <Image
                src={src}
                alt={`Scarab — photo ${i + 1}`}
                fill
                sizes="(min-width: 768px) 320px, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
