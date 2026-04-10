import { ElevationPoint } from "@/types/strava";

interface Props {
  points: ElevationPoint[];
  maxElevation: string;
  totalDistance: string;
}

export default function ElevationProfile({
  points,
  maxElevation,
  totalDistance,
}: Props) {
  if (points.length < 2) return null;

  const width = 1000;
  const height = 200;
  const padX = 10;
  const padTop = 20;
  const padBottom = 20;

  const distances = points.map((p) => p.distance);
  const altitudes = points.map((p) => p.altitude);
  const maxDist = Math.max(...distances);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const altRange = maxAlt - minAlt || 1;

  const scaleX = (d: number) =>
    padX + ((d - 0) / maxDist) * (width - 2 * padX);
  const scaleY = (a: number) =>
    padTop + (1 - (a - minAlt) / altRange) * (height - padTop - padBottom);

  // Build line path
  const linePath = points
    .map((p, i) => {
      const x = scaleX(p.distance);
      const y = scaleY(p.altitude);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  // Build filled area path (close at bottom)
  const areaPath = `${linePath} L${scaleX(maxDist).toFixed(1)},${(
    height - padBottom
  ).toFixed(1)} L${scaleX(0).toFixed(1)},${(height - padBottom).toFixed(1)} Z`;

  // Find highest point for the marker
  const maxIdx = altitudes.indexOf(maxAlt);
  const maxX = scaleX(points[maxIdx].distance);
  const maxY = scaleY(points[maxIdx].altitude);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-brand">
          Elevation Profile
        </h3>
        <div className="flex items-center gap-4 text-xs text-mist">
          <span>
            <span className="font-semibold text-text">{maxElevation}</span> ft gained
          </span>
          <span>
            <span className="font-semibold text-text">{totalDistance}</span> mi
          </span>
        </div>
      </div>

      <div className="relative bg-surface rounded-xl border border-border p-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="none"
          style={{ maxHeight: "200px" }}
        >
          <defs>
            <linearGradient id="elevGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fc5200" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fc5200" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={padX}
              x2={width - padX}
              y1={padTop + p * (height - padTop - padBottom)}
              y2={padTop + p * (height - padTop - padBottom)}
              stroke="#e5e5e5"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          ))}

          {/* Filled area */}
          <path d={areaPath} fill="url(#elevGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#fc5200"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Max elevation marker */}
          <circle cx={maxX} cy={maxY} r="4" fill="#fc5200" />
          <circle
            cx={maxX}
            cy={maxY}
            r="8"
            fill="none"
            stroke="#fc5200"
            strokeOpacity="0.3"
            strokeWidth="2"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-4 top-3 text-[10px] text-mist font-mono">
          {Math.round(maxAlt)} ft
        </div>
        <div className="absolute left-4 bottom-3 text-[10px] text-mist font-mono">
          {Math.round(minAlt)} ft
        </div>
        <div className="absolute right-4 bottom-3 text-[10px] text-mist font-mono">
          {maxDist.toFixed(1)} mi
        </div>
      </div>
    </div>
  );
}
