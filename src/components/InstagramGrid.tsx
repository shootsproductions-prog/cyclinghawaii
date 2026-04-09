import SectionHeader from "./SectionHeader";

const posts = [
  { gradient: "from-brand to-strava", caption: "Haleakala summit at dawn" },
  { gradient: "from-surface to-border", caption: "Road to Hana coastal stretch" },
  { gradient: "from-[#1a1a1a] via-[#333] to-brand", caption: "Chain of Craters descent" },
  { gradient: "from-border to-brand/60", caption: "North Shore rollers" },
  { gradient: "from-strava to-brand", caption: "Waipio Valley lookout" },
  { gradient: "from-[#1a1a1a] to-[#333]", caption: "Kailua group ride" },
];

function InstaIcon() {
  return (
    <svg
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="text-white/20"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}

export default function InstagramGrid() {
  return (
    <section id="instagram" className="py-20 px-6">
      <SectionHeader
        label="From the Feed"
        title="@cyclinghawaii"
        description="Vini posts when the light is right. Which in Hawaii is basically always."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-[1100px] mx-auto">
        {posts.map((post, i) => (
          <div
            key={i}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-border"
          >
            <div
              className={`w-full h-full bg-gradient-to-br ${post.gradient} flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.06]`}
            >
              <InstaIcon />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/70 via-transparent to-transparent flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-sm text-[#f0f0f0]">{post.caption}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <a
          href="https://instagram.com/cyclinghawaii"
          target="_blank"
          rel="noopener noreferrer"
          className="text-strava font-semibold text-sm hover:text-brand transition-colors"
        >
          Follow @cyclinghawaii &rarr;
        </a>
        <p className="text-mist text-sm mt-3 italic">
          Paradise is a state of mind.
        </p>
      </div>
    </section>
  );
}
