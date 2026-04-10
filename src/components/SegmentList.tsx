import { FormattedSegment } from "@/types/strava";

interface Props {
  segments: FormattedSegment[];
}

export default function SegmentList({ segments }: Props) {
  if (segments.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-brand">
          Segments
        </h3>
        <span className="text-xs text-mist">
          {segments.length} {segments.length === 1 ? "effort" : "efforts"}
        </span>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Header row (desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-6 px-5 py-3 border-b border-border text-[0.65rem] font-semibold text-mist uppercase tracking-wider">
          <div>Name</div>
          <div className="text-right">Time</div>
          <div className="text-right">Distance</div>
          <div className="text-right">Grade</div>
          <div className="text-right">Power</div>
        </div>

        {/* Rows */}
        {segments.map((seg) => (
          <a
            key={seg.id}
            href={seg.stravaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border-b border-border last:border-b-0 hover:bg-card transition-colors no-underline"
          >
            {/* Desktop layout */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-6 items-center px-5 py-4">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-text truncate">
                  {seg.name}
                </span>
                {seg.isKOM && (
                  <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-[#ffd700] text-[#5c4400] shrink-0">
                    KOM
                  </span>
                )}
                {seg.isPR && !seg.isKOM && (
                  <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-strava text-white shrink-0">
                    PR
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-text text-right tabular-nums">
                {seg.time}
              </div>
              <div className="text-sm text-mist text-right tabular-nums">
                {seg.distanceMi} mi
              </div>
              <div className="text-sm text-mist text-right tabular-nums">
                {seg.avgGrade}%
              </div>
              <div className="text-sm text-mist text-right tabular-nums">
                {seg.avgWatts ? `${seg.avgWatts}w` : "—"}
              </div>
            </div>

            {/* Mobile layout */}
            <div className="md:hidden px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-text flex-1 truncate">
                  {seg.name}
                </span>
                {seg.isKOM && (
                  <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-[#ffd700] text-[#5c4400]">
                    KOM
                  </span>
                )}
                {seg.isPR && !seg.isKOM && (
                  <span className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-strava text-white">
                    PR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-mist">
                <span className="font-semibold text-text">{seg.time}</span>
                <span>{seg.distanceMi} mi</span>
                <span>{seg.avgGrade}%</span>
                {seg.avgWatts && <span>{seg.avgWatts}w</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
