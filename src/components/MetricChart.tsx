import { StreamPoint } from "@/types/strava";

interface Props {
  title: string;
  points: StreamPoint[];
  unit: string; // "bpm" | "w"
  colorFrom: string; // hex — gradient top
  colorTo: string; // hex — gradient bottom
  lineColor: string; // hex — stroke
  summaryLabel?: string;
  summaryValue?: string;
}

export default function MetricChart({
  title,
  points,
  unit,
  colorFrom,
  colorTo,
  lineColor,
  summaryLabel,
  summaryValue,
}: Props) {
  if (points.length < 2) return null;

  const width = 1000;
  const height = 200;
  const padX = 10;
  const padTop = 20;
  const padBottom = 20;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;

  const scaleX = (x: number) =>
    padX + (x / (maxX || 1)) * (width - 2 * padX);
  const scaleY = (y: number) =>
    padTop + (1 - (y - minY) / rangeY) * (height - padTop - padBottom);

  const linePath = points
    .map((p, i) => {
      const x = scaleX(p.x);
      const y = scaleY(p.y);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L${scaleX(maxX).toFixed(1)},${(
    height - padBottom
  ).toFixed(1)} L${scaleX(0).toFixed(1)},${(height - padBottom).toFixed(1)} Z`;

  // Peak marker at max Y
  const maxIdx = ys.indexOf(maxY);
  const peakX = scaleX(points[maxIdx].x);
  const peakY = scaleY(points[maxIdx].y);

  // Generate unique gradient ID from title to avoid SVG <defs> collisions
  const gradId = `grad-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-widest uppercase text-brand">
          {title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-mist">
          <span>
            Max{" "}
            <span className="font-semibold text-text">
              {Math.round(maxY)}
            </span>{" "}
            {unit}
          </span>
          {summaryLabel && summaryValue && (
            <span>
              {summaryLabel}{" "}
              <span className="font-semibold text-text">{summaryValue}</span>
            </span>
          )}
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
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={colorFrom} stopOpacity="0.45" />
              <stop offset="100%" stopColor={colorTo} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
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

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak marker */}
          <circle cx={peakX} cy={peakY} r="4" fill={lineColor} />
          <circle
            cx={peakX}
            cy={peakY}
            r="8"
            fill="none"
            stroke={lineColor}
            strokeOpacity="0.3"
            strokeWidth="2"
          />
        </svg>

        {/* Axis labels */}
        <div className="absolute left-4 top-3 text-[10px] text-mist font-mono">
          {Math.round(maxY)} {unit}
        </div>
        <div className="absolute left-4 bottom-3 text-[10px] text-mist font-mono">
          {Math.round(minY)} {unit}
        </div>
        <div className="absolute right-4 bottom-3 text-[10px] text-mist font-mono">
          {maxX.toFixed(1)} mi
        </div>
      </div>
    </div>
  );
}
