import { Badge } from "@/lib/badges";

interface Props {
  badges: Badge[];
}

const metricIcons: Record<string, string> = {
  miles: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3",
  elevationFt: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  rides: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  movingTimeHours: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  calories: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
};

export default function BadgeWall({ badges }: Props) {
  if (badges.length === 0) return null;

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <div className="text-center mb-6">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand">
          Trophy Case
        </span>
        <p className="text-mist text-xs mt-1">
          {badges.length} {badges.length === 1 ? "challenge" : "challenges"} conquered
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {badges.map((badge) => {
          const iconPath = metricIcons[badge.metric] || metricIcons.miles;
          const monthDate = new Date(badge.month + "-01");
          const monthShort = monthDate.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });

          return (
            <div
              key={badge.month}
              className="group flex flex-col items-center gap-2 w-20"
              title={`${badge.name}: ${badge.achieved.toLocaleString()} ${badge.metricLabel} (goal: ${badge.goal.toLocaleString()})`}
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-strava flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d={iconPath} />
                </svg>
              </div>
              <div className="text-center">
                <div className="text-[0.65rem] font-semibold text-text leading-tight">
                  {badge.name}
                </div>
                <div className="text-[0.6rem] text-mist">{monthShort}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
