import { FormattedRide, FormattedStats } from "@/types/strava";
import SectionHeader from "./SectionHeader";
import StravaCard from "./StravaCard";
import StravaSummary from "./StravaSummary";

interface Props {
  rides: FormattedRide[];
  stats: FormattedStats;
}

export default function StravaFeed({ rides, stats }: Props) {
  return (
    <section id="strava" className="py-20 px-6 bg-surface">
      <SectionHeader
        label="Strava"
        title="Recent Rides"
        description="Vini's ride log. Automatically pulled from Strava because he's too busy pedaling to update a website."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1200px] mx-auto mb-10">
        {rides.slice(0, 9).map((ride) => (
          <StravaCard key={ride.id} ride={ride} />
        ))}
      </div>

      <StravaSummary stats={stats} />
    </section>
  );
}
