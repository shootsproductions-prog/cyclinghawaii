import { Badge } from "@/lib/badges";
import { BonusBadge } from "@/lib/bonus-badges";

interface Props {
  badges: Badge[];
  bonusBadges?: BonusBadge[];
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

// Bonus badge icons + gradient palettes
interface BonusVisual {
  icon: string;
  gradient: string;
}
const bonusVisuals: Record<string, BonusVisual> = {
  // Mountain peak (First Century — long ride feels like climbing the mountain of distance)
  century: {
    icon: "M3 19l5.5-7 4 5 3.5-4.5L21 19H3z",
    gradient: "from-[#fc5200] to-[#b45309]",
  },
  // Crown (Haleakala Crown)
  crown: {
    icon: "M3 17l3-9 4 6 2-9 2 9 4-6 3 9H3z",
    gradient: "from-[#ffd700] to-[#b45309]",
  },
  // Flame (30-Day Streak)
  fire: {
    icon: "M12 2c1.5 4 6 5 6 11a6 6 0 11-12 0c0-3 2-4 2-7 1.5 1 3 1 4-4z",
    gradient: "from-[#ef4444] to-[#fc5200]",
  },
  // Diamond (6K Year)
  diamond: {
    icon: "M6 3h12l3 6-9 12L3 9l3-6z",
    gradient: "from-[#0ea5e9] to-[#a855f7]",
  },
};

function compactNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return n.toString();
}

export default function BadgeWall({ badges, bonusBadges = [] }: Props) {
  if (badges.length === 0 && bonusBadges.length === 0) return null;

  // Sort monthly chronologically
  const sortedMonthly = [...badges].sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const earnedCount = sortedMonthly.filter(
    (b) => b.status === "earned"
  ).length;
  const missedCount = sortedMonthly.length - earnedCount;

  // Sort bonus by earnedAt
  const sortedBonus = [...bonusBadges].sort((a, b) =>
    a.earnedAt.localeCompare(b.earnedAt)
  );

  return (
    <div className="mt-8 pt-8 border-t border-border">
      <div className="text-center mb-6">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-brand">
          Trophy Case
        </span>
        {sortedMonthly.length > 0 && (
          <p className="text-mist text-xs mt-1">
            {earnedCount} earned
            {missedCount > 0 ? ` · ${missedCount} missed` : ""}
            {sortedBonus.length > 0
              ? ` · ${sortedBonus.length} achievement${sortedBonus.length === 1 ? "" : "s"}`
              : ""}
          </p>
        )}
      </div>

      {/* Monthly streak */}
      {sortedMonthly.length > 0 && (
        <div className="mb-8">
          <h4 className="text-[0.65rem] font-semibold tracking-widest uppercase text-mist text-center mb-4">
            Monthly Streak
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            {sortedMonthly.map((badge) => {
              const iconPath =
                metricIcons[badge.metric] || metricIcons.miles;
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
                    <div className="text-[0.6rem] text-mist">
                      {monthShort}
                    </div>
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
      )}

      {/* Bonus achievements */}
      {sortedBonus.length > 0 && (
        <div>
          <h4 className="text-[0.65rem] font-semibold tracking-widest uppercase text-mist text-center mb-4">
            Achievements
          </h4>
          <div className="flex flex-wrap justify-center gap-5">
            {sortedBonus.map((badge) => {
              const visual =
                bonusVisuals[badge.iconKey] || bonusVisuals.diamond;
              const tooltip = `${badge.name} — ${badge.description}${badge.details ? ` (${badge.details})` : ""}`;

              return (
                <div
                  key={badge.id}
                  className="group flex flex-col items-center gap-2 w-24"
                  title={tooltip}
                >
                  <div
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform bg-gradient-to-br ${visual.gradient}`}
                  >
                    <svg
                      width="26"
                      height="26"
                      fill="white"
                      viewBox="0 0 24 24"
                    >
                      <path d={visual.icon} />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="text-[0.65rem] font-semibold leading-tight text-text">
                      {badge.name}
                    </div>
                    {badge.details && (
                      <div className="text-[0.6rem] text-mist mt-0.5 tabular-nums">
                        {badge.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
