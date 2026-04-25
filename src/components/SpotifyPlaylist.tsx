import SectionHeader from "./SectionHeader";

export default function SpotifyPlaylist() {
  return (
    <section id="spotify" className="py-20 px-6">
      <SectionHeader
        label="Soundtrack"
        title="Laura's Playlist"
        description="I know him. This is what holds him up when the climb gets stubborn."
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

      <p className="text-xs text-mist italic text-center mt-4 max-w-[640px] mx-auto">
        Reggae roots, dub, downtempo, Brazilian soul, slow-burn electronica.
        Low-end gravity, forward motion, no urgency. He doesn&apos;t always
        reach for headphones — sometimes the wind is the song. But when he
        does, this is waiting. &mdash; Laura
      </p>
    </section>
  );
}
