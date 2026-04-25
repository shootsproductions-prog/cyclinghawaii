import SectionHeader from "./SectionHeader";

export default function SpotifyPlaylist() {
  return (
    <section id="spotify" className="py-20 px-6">
      <SectionHeader
        label="Soundtrack"
        title="Cycling Hawaii"
        description="I know him. This is what holds him up when the climb gets stubborn."
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

      <p className="text-sm text-mist italic text-center mt-5 max-w-[640px] mx-auto leading-relaxed">
        Dub weight, trip-hop patience, slow-burn soul. Low-end gravity,
        forward motion, no urgency. He doesn&apos;t always reach for headphones
        — sometimes the wind is the song. But when he does, this is waiting.
      </p>

      <p className="text-xs text-mist text-center mt-5 max-w-[640px] mx-auto leading-relaxed">
        If you ride and you&apos;ve been waiting for music that doesn&apos;t
        yell at you, give this a try on your next climb. Save it. Share it.
        Use it on the days when the body is heavy and the road is long. I made it for him,
        but it works for any cyclist who&apos;s here for the miles, not the hype.
        &mdash; Laura
      </p>
    </section>
  );
}
