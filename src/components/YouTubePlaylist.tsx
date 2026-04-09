import SectionHeader from "./SectionHeader";

export default function YouTubePlaylist() {
  return (
    <section id="youtube" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="YouTube"
        title="Watch the Rides"
        description="45mm tubeless tires over lava rocks. No can road bikes."
      />

      <div className="max-w-[1100px] mx-auto rounded-2xl overflow-hidden border border-border shadow-sm">
        <iframe
          src="https://www.youtube.com/embed/videoseries?list=PLVl2WPmjReqPghDnpN5CZw4oHqe7ywb8W"
          title="Cycling Hawaii YouTube Playlist"
          className="w-full aspect-video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </section>
  );
}
