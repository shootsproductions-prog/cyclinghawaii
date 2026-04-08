import SectionHeader from "./SectionHeader";

const posts = [
  { gradient: "from-ocean-deep to-ocean", caption: "Haleakala summit at dawn" },
  { gradient: "from-fern to-jungle", caption: "Road to Hana coastal stretch" },
  { gradient: "from-volcanic via-lava to-ocean", caption: "Chain of Craters descent" },
  { gradient: "from-[#0d1117] to-fern", caption: "North Shore rollers" },
  { gradient: "from-ocean to-lagoon", caption: "Waipio Valley lookout" },
  { gradient: "from-lava to-ocean-deep", caption: "Kailua group ride" },
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
      className="text-white/10"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}

export default function InstagramGrid() {
  return (
    <section id="instagram" className="py-24 px-8 bg-volcanic">
      <SectionHeader
        label="@cyclinghawaii"
        title="From the Feed"
        description="Scenes from the road — sunrises, summits, and everything in between."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-[1100px] mx-auto">
        {posts.map((post, i) => (
          <div
            key={i}
            className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-basalt"
          >
            <div
              className={`w-full h-full bg-gradient-to-br ${post.gradient} flex items-center justify-center transition-transform duration-500 group-hover:scale-[1.06]`}
            >
              <InstaIcon />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-sm text-mist">{post.caption}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <a
          href="https://instagram.com/cyclinghawaii"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ocean-light font-semibold text-sm hover:text-lagoon transition-colors"
        >
          Follow @cyclinghawaii &rarr;
        </a>
      </div>
    </section>
  );
}
