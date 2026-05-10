import { getStravaData } from "@/lib/strava";
import SectionHeader from "./SectionHeader";
import StravaCard from "./StravaCard";
import StravaSummary from "./StravaSummary";

export default async function StravaRides() {
  const { rides, stats } = await getStravaData();

  return (
    <section
      id="strava"
      className="py-24 px-8"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
      }}
    >
      <SectionHeader
        label="Strava"
        title="Recent Rides"
        description="Latest routes and stats — updated automatically from Strava."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1100px] mx-auto mb-10">
        {rides.slice(0, 6).map((ride) => (
          <StravaCard key={ride.id} ride={ride} />
        ))}
      </div>

      <StravaSummary stats={stats} />
    </section>
  );
}
