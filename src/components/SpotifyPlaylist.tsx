import SectionHeader from "./SectionHeader";

export default function SpotifyPlaylist() {
  return (
    <section id="spotify" className="py-20 px-6">
      <SectionHeader
        label="Soundtrack"
        title="What's on Repeat"
        description="The playlist that powers every pedal stroke. Laura didn't pick these. Vini did. She has notes."
      />

      <div className="max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-border shadow-sm bg-card">
        <iframe
          src="https://open.spotify.com/embed/playlist/6baoOpVDNZ1vR9HZJl5BWs?utm_source=generator&theme=0"
          title="Cycling Hawaii Soundtrack"
          className="w-full h-[480px] border-none block"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
    </section>
  );
}
