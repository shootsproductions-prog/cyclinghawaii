// What every ride-file parser produces, whatever the format.

export interface RideSample {
  /** Unix time in seconds. */
  t: number;
  lat?: number;
  lon?: number;
  /** Elevation in metres. */
  ele?: number;
  hr?: number;
  cad?: number;
  power?: number;
  /** Cumulative distance in metres, when the device recorded it. */
  dist?: number;
  /** Speed in metres per second, when the device recorded it. */
  speed?: number;
}

export interface ParsedRide {
  format: "fit" | "gpx" | "tcx";
  name?: string;
  /** "cycling", "Biking", "Ride" ... as the file calls it. */
  sport?: string;
  subSport?: string;
  samples: RideSample[];
  /** Totals the device wrote itself (FIT session message). Preferred over recomputing. */
  session?: {
    startTime?: number;
    elapsedSec?: number;
    timerSec?: number;
    distanceM?: number;
    ascentM?: number;
    avgHr?: number;
    maxHr?: number;
    avgPower?: number;
    normPower?: number;
    avgCadence?: number;
  };
}
