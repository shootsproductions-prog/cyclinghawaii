import { Challenge as ChallengeType } from "@/lib/challenge";
import { Badge } from "@/lib/badges";
import BadgeWall from "./BadgeWall";

interface Props {
  challenge: ChallengeType;
  badges: Badge[];
}

export default function Challenge({ challenge, badges }: Props) {
  const isComplete = challenge.progressPct >= 100;

  return (
    <section id="challenge" className="py-20 px-6 bg-surface">
      <div className="max-w-[800px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-[0.7rem] font-semibold tracking-[0.2em] uppercase text-brand mb-3">
            Challenge of the Month
          </div>
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl md:text-4xl font-bold tracking-tight text-text mb-2">
            {challenge.name}
          </h2>
          <p className="text-mist text-base">{challenge.description}</p>
        </div>

        {/* Progress card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {/* Numbers */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-5xl font-bold text-strava">
                {challenge.current.toLocaleString()}
              </span>
              <span className="text-mist text-lg ml-2">
                / {challenge.goal.toLocaleString()} {challenge.metricLabel}
              </span>
            </div>
            <span
              className={`font-[family-name:var(--font-space-grotesk)] text-2xl font-bold ${
                isComplete ? "text-[#22c55e]" : "text-text"
              }`}
            >
              {challenge.progressPct}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-4 bg-surface rounded-full overflow-hidden mb-6">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isComplete
                  ? "bg-[#22c55e]"
                  : "bg-gradient-to-r from-brand to-strava"
              }`}
              style={{ width: `${challenge.progressPct}%` }}
            />
          </div>

          {/* Coach note */}
          <div className="flex items-start gap-3 border-t border-border pt-5">
            <div className="w-8 h-8 rounded-full bg-strava/10 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#fc5200"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-semibold text-strava uppercase tracking-wider">
                Coach&apos;s Note
              </span>
              <p className="text-mist text-sm mt-1 italic">
                {challenge.coachNote}
              </p>
            </div>
          </div>
        </div>

        {/* Month label */}
        <p className="text-center text-xs text-mist mt-4">
          {challenge.monthLabel}
        </p>

        {/* Badge wall */}
        <BadgeWall badges={badges} />
      </div>
    </section>
  );
}
