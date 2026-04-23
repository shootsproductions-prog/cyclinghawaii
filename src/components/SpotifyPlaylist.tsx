import SectionHeader from "./SectionHeader";

export default function SpotifyPlaylist() {
  return (
    <section id="spotify" className="py-20 px-6">
      <SectionHeader
        label="Soundtrack"
        title="Laura's Playlist"
        description="I built this so he'd stop curating and start riding. Forward momentum, zero emotional labor."
      />

      <div className="max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
        <iframe
          src="https://open.spotify.com/embed/playlist/37i9dQZF1FwKh2afuwXYEh?utm_source=generator&theme=0"
          title="Laura's Playlist"
          className="w-full h-[480px] border-none block"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>

      <p className="text-xs text-mist italic text-center mt-4 max-w-[600px] mx-auto">
        Motorik krautrock, minimal techno, deadpan post-punk. If a song
        sounds like it was licensed for a car commercial, I didn&apos;t
        pick it. &mdash; Laura
      </p>
    </section>
  );
}
