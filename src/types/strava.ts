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
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  start_date: string; // ISO 8601
  start_date_local: string; // ISO 8601
  average_speed: number; // m/s
  max_speed: number; // m/s
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
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  elevation_gain: number; // meters
}

export interface FormattedRide {
  id: number;
  name: string;
  type: string;
  distance: string; // "36.2"
  time: string; // "1:48"
  elevation: string; // "9,740"
  date: string; // "Apr 4, 2026"
  elevationPct: number; // 0-100 for progress bar
  averageSpeed: string; // "18.4"
}

export interface FormattedStats {
  totalMiles: string;
  totalRides: string;
  totalElevation: string;
  avgSpeed: string;
}
