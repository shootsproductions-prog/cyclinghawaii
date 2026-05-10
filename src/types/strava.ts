export interface StravaTokenResponse {
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  token_type: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  kudos_count: number;
  comment_count: number;
  photo_count: number;
  achievement_count: number;
  calories: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  average_cadence?: number;
  suffer_score?: number;
  gear_id?: string;
  start_latlng?: [number, number] | null; // [lat, lng]
  map: {
    id: string;
    summary_polyline: string;
  };
}

export interface StravaAthleteStats {
  biggest_ride_distance?: number; // meters
  biggest_climb_elevation_gain?: number; // meters
  recent_ride_totals: StravaTotals;
  all_ride_totals: StravaTotals;
  ytd_ride_totals: StravaTotals;
}

export interface StravaTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

export interface StravaPhoto {
  unique_id: string;
  urls: Record<string, string>;
  caption: string;
  source: number;
}

export interface FormattedRide {
  id: number;
  name: string;
  type: string;
  distance: string;
  time: string;
  elevation: string;
  date: string;
  elevationPct: number;
  averageSpeed: string;
  kudos: number;
  comments: number;
  calories: number;
  avgHeartrate?: number;
  avgWatts?: number;
  avgCadence?: number;
  achievements: number;
  polyline: string;
  mapImageUrl: string;
  stravaUrl: string;
}

export interface ElevationPoint {
  distance: number; // miles
  altitude: number; // feet
}

export interface StreamPoint {
  x: number; // distance (miles)
  y: number; // metric value
}

export interface MaxStats {
  maxSpeed: number; // mph
  maxHeartrate: number; // bpm
  maxPower: number; // watts
  maxGrade: number; // %
}

export interface WeatherData {
  tempF: number;
  windMph: number;
  windDir: string; // "N", "NE", etc.
  conditions: string; // "Clear", "Rainy", etc.
  humidity: number; // %
}

export interface ZoneBucket {
  zone: number; // 1-5
  pct: number; // 0-100
  minutes: number;
}

export interface BestEffort {
  name: string; // "1 mile", "5K", "10K", etc.
  time: string; // "4:23"
  isPR: boolean;
}

export interface RideAnalytics {
  // HR insights
  hrZones: ZoneBucket[]; // distribution across Z1-Z5
  hrDrift: number; // % HR climbed from first to second half
  // Power insights
  powerVariability: number; // VI = NP/Avg, higher = more bursty
  normalizedPower: number; // est. NP
  // Effort & pacing
  firstHalfAvgPower: number;
  secondHalfAvgPower: number;
  movingTimeSec: number;
  elapsedTimeSec: number;
  stoppedTimeSec: number;
  // Strava native
  sufferScore?: number;
  // Best efforts (PRs, fastest segments by distance)
  bestEfforts: BestEffort[];
}

export interface BikeStats {
  name: string;
  totalMiles: number;
  rideCount?: number; // not always available
  firstRideDate?: string; // ISO date
}

/**
 * Aggregate stats for the dedicated Stats section. All numbers are
 * raw values — the component formats them at render time.
 */
export interface StatsSummary {
  // Year goal
  ytdMiles: number;
  yearGoal: number;
  paceMiles: number; // projected end-of-year miles based on current pace
  targetTodayMiles: number; // where you should be today on linear pace to hit the goal

  // This month (snapshot — already in monthlyStats but we duplicate the key fields)
  monthMiles: number;
  monthRides: number;
  monthElevationFt: number;
  monthHours: number;

  // Last 4 weeks (rolling)
  recentMiles: number;
  recentRides: number;
  recentElevationFt: number;

  // Year to date (totals)
  ytdRides: number;
  ytdElevationFt: number;
  ytdAvgSpeed: number;

  // All time
  lifetimeMiles: number;
  lifetimeRides: number;
  lifetimeElevationFt: number;

  // Records
  biggestRideMiles: number;
  biggestClimbFt: number;
  longestStreakDays: number;
}

export interface StravaSegmentEffortRaw {
  id: number;
  name: string;
  elapsed_time: number;
  distance: number;
  average_heartrate?: number;
  average_watts?: number;
  pr_rank?: number | null;
  kom_rank?: number | null;
  segment: {
    id: number;
    name: string;
    average_grade: number;
    maximum_grade: number;
    elevation_high: number;
    elevation_low: number;
    distance: number;
  };
}

export interface FormattedSegment {
  id: number;
  name: string;
  time: string;
  distanceMi: string;
  avgGrade: number;
  avgWatts?: number;
  avgHeartrate?: number;
  isPR: boolean;
  isKOM: boolean;
  stravaUrl: string;
}

export interface FormattedFeaturedRide extends FormattedRide {
  photos: StravaPhoto[];
  largeMapImageUrl: string;
  elevationProfile: ElevationPoint[];
  heartrateProfile: StreamPoint[];
  powerProfile: StreamPoint[];
  maxStats: MaxStats;
  analytics: RideAnalytics;
  weather?: WeatherData;
  segments: FormattedSegment[];
}

export interface FormattedStats {
  totalMiles: string;
  totalRides: string;
  totalElevation: string;
  avgSpeed: string;
}

export interface MonthlyStats {
  miles: number;
  rides: number;
  elevationFt: number;
  movingTimeHours: number;
  calories: number;
  avgSpeedMph: number;
}

export interface StravaData {
  featured: FormattedFeaturedRide;
  rides: FormattedRide[];
  stats: FormattedStats;
  statsSummary: StatsSummary;
  monthlyStats: MonthlyStats;
  bike: BikeStats | null;
  /** Raw Strava activities — exposed for bonus badge detection. */
  rawActivities: StravaActivity[];
}
