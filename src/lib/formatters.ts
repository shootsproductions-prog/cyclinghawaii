export function metersToMiles(meters: number): number {
  return meters * 0.000621371;
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function mpsToMph(mps: number): number {
  return mps * 2.23694;
}

export function formatDistance(meters: number): string {
  return metersToMiles(meters).toFixed(1);
}

export function formatElevation(meters: number): string {
  return Math.round(metersToFeet(meters)).toLocaleString();
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}:${mins.toString().padStart(2, "0")}`;
}

export function formatSpeed(mps: number): string {
  return mpsToMph(mps).toFixed(1);
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
