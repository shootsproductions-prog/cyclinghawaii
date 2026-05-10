import SectionHeader from "./SectionHeader";

export default function SpotifyPlaylist() {
  return (
    <section id="spotify" className="py-20 px-6">
      <SectionHeader
        label="Soundtrack"
        title="Curated Like His Bibs"
        description="He's particular about every detail that matters. Music made the list."
      />

      <div className="max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
        <iframe
          src="https://open.spotify.com/embed/playlist/37i9dQZF1FwKh2afuwXYEh?utm_source=generator&theme=0"
          title="Cycling Hawaii — Laura's Playlist"
          className="w-full h-[480px] border-none block"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>

      <p className="text-sm text-mist italic text-center mt-6 max-w-[640px] mx-auto leading-relaxed">
        — sometimes, the wind is the song.
      </p>
    </section>
  );
}
