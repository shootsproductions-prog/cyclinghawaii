import { Badge } from "@/lib/badges";

interface Props {
  badges: Badge[];
}

const metricIcons: Record<string, string> = {
  miles:
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3",
  elevationFt: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  rides: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  movingTimeHours: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  calories:
    "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
};

function compactNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return n.toString();
}

export default function BadgeWall({ badges }: Props) {
  if (badges.length === 0) return null;

  // Sort chronologically — oldest first so the streak reads left-to-right
  const sorted = [...badges].sort((a, b) => a.month.localeCompare(b.month));
  const earnedCount = sorted.filter((b) => b.status === "earned").length;
  const missedCount = sorted.length - earnedCount;

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <div className="text-center mb-6">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand">
          Trophy Case
        </span>
        <p className="text-mist text-xs mt-1">
          {earnedCount} earned
          {missedCount > 0 ? ` · ${missedCount} missed` : ""}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {sorted.map((badge) => {
          const iconPath = metricIcons[badge.metric] || metricIcons.miles;
          const monthDate = new Date(badge.month + "-01");
          const monthShort = monthDate.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          });

          const earned = badge.status === "earned";
          const tooltip = earned
            ? `${badge.name}: ${badge.achieved.toLocaleString()} / ${badge.goal.toLocaleString()} ${badge.metricLabel} — earned`
            : `${badge.name}: ${badge.achieved.toLocaleString()} / ${badge.goal.toLocaleString()} ${badge.metricLabel} — missed`;

          return (
            <div
              key={badge.month}
              className="group flex flex-col items-center gap-2 w-20"
              title={tooltip}
            >
              <div
                className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${
                  earned
                    ? "bg-gradient-to-br from-brand to-strava"
                    : "bg-gradient-to-br from-[#cbcbcb] to-[#888] opacity-80"
                }`}
              >
                <svg
                  width="22"
                  height="22"
                  fill="none"
                  stroke={earned ? "white" : "rgba(255,255,255,0.85)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d={iconPath} />
                </svg>
                {!earned && (
                  // Subtle "incomplete" mark in the corner
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      stroke="#888"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="text-center">
                <div
                  className={`text-[0.65rem] font-semibold leading-tight ${
                    earned ? "text-text" : "text-mist"
                  }`}
                >
                  {badge.name}
                </div>
                <div className="text-[0.6rem] text-mist">{monthShort}</div>
                {!earned && badge.goal > 0 && (
                  <div className="text-[0.6rem] text-mist/70 mt-0.5 tabular-nums">
                    {compactNumber(badge.achieved)} /{" "}
                    {compactNumber(badge.goal)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
