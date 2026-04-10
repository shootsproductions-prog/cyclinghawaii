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
  map: {
    id: string;
    summary_polyline: string;
  };
}

export interface StravaAthleteStats {
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
  monthlyStats: MonthlyStats;
}
