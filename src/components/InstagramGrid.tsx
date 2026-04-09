import SectionHeader from "./SectionHeader";

export default function InstagramGrid() {
  return (
    <section id="instagram" className="py-20 px-6">
      <SectionHeader
        label="From the Feed"
        title="@cyclinghawaii"
        description="Vini posts when the light is right. Which in Hawaii is basically always."
      />

      <div className="max-w-[1100px] mx-auto">
        {/* Behold Instagram Widget */}
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <behold-widget feed-id="JlAtKSfcQhzyRRAzuuAj"></behold-widget>
              <script>
                (() => {
                  if (document.querySelector('script[src="https://w.behold.so/widget.js"]')) return;
                  const d=document,s=d.createElement("script");s.type="module";
                  s.src="https://w.behold.so/widget.js";d.head.append(s);
                })();
              </script>
            `,
          }}
        />
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
