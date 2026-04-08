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
  achievements: number;
  polyline: string;
  mapImageUrl: string;
  stravaUrl: string;
}

export interface FormattedFeaturedRide extends FormattedRide {
  photos: StravaPhoto[];
  largeMapImageUrl: string;
}

export interface FormattedStats {
  totalMiles: string;
  totalRides: string;
  totalElevation: string;
  avgSpeed: string;
}

export interface StravaData {
  featured: FormattedFeaturedRide;
  rides: FormattedRide[];
  stats: FormattedStats;
}
