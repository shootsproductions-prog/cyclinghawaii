import Anthropic from "@anthropic-ai/sdk";
import { put, list } from "@vercel/blob";
import { FormattedFeaturedRide, FormattedRide } from "@/types/strava";
import { getAccessToken, getActivityPhotos } from "./strava";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const BLOB_KEY = "blog-entries.json";

export interface BlogEntry {
  rideId: number;
  title: string;
  date: string;
  body: string;
  rideName: string;
  stravaUrl: string;
  mapImageUrl: string;
  photoUrl?: string;
  distance: string;
  elevation: string;
  time: string;
  generatedAt: string;
}

// Load all existing entries from blob storage
async function loadEntries(): Promise<BlogEntry[]> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length === 0) return [];

    const latest = blobs.blobs[0];
    const res = await fetch(latest.url);
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.log("No existing blog entries found:", error);
    return [];
  }
}

// Save all entries to blob storage
async function saveEntries(entries: BlogEntry[]): Promise<void> {
  try {
    await put(BLOB_KEY, JSON.stringify(entries), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    console.error("Failed to save blog entries:", error);
  }
}

async function fetchFirstPhotoUrl(
  token: string,
  rideId: number,
  existingPhotos?: FormattedFeaturedRide["photos"]
): Promise<string | undefined> {
  // Use featured ride's already-fetched photos if available
  if (existingPhotos && existingPhotos.length > 0) {
    const first = existingPhotos[0];
    return first.urls?.["600"] || Object.values(first.urls)[0];
  }

  try {
    const photos = await getActivityPhotos(token, rideId);
    if (photos.length === 0) return undefined;
    const first = photos[0];
    return first.urls?.["600"] || Object.values(first.urls)[0];
  } catch {
    return undefined;
  }
}

export async function generateBlogEntries(
  featured: FormattedFeaturedRide,
  rides: FormattedRide[]
): Promise<BlogEntry[]> {
  // Load existing archive
  const existingEntries = await loadEntries();
  const existingIds = new Set(existingEntries.map((e) => e.rideId));

  // Determine which rides need new entries (featured + recent)
  const ridesToCheck = [featured, ...rides.slice(0, 2)];
  const newRides = ridesToCheck.filter((r) => !existingIds.has(r.id));

  if (newRides.length > 0) {
    // Get Strava token once for photo fetching
    let stravaToken: string | null = null;
    try {
      stravaToken = await getAccessToken();
    } catch {
      // Photo fetching will be skipped
    }

    for (const ride of newRides) {
      // Fetch one photo for this ride
      let photoUrl: string | undefined;
      if (stravaToken) {
        const isFeaturedRide = ride.id === featured.id;
        photoUrl = await fetchFirstPhotoUrl(
          stravaToken,
          ride.id,
          isFeaturedRide ? featured.photos : undefined
        );
      }

      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const entry = await generateEntry(ride, photoUrl);
          existingEntries.unshift(entry);
        } catch (error) {
          console.error(`Blog generation failed for ride ${ride.id}:`, error);
          existingEntries.unshift(makeFallbackEntry(ride, photoUrl));
        }
      } else {
        existingEntries.unshift(makeFallbackEntry(ride, photoUrl));
      }
    }

    await saveEntries(existingEntries);
  }

  // Return all entries (for the archive page), sorted newest first
  return existingEntries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function generateEntry(
  ride: FormattedRide | FormattedFeaturedRide,
  photoUrl?: string
): Promise<BlogEntry> {
  const prompt = `You are the witty narrator of Vini Pimenta's cycling journal "Log Files" on cyclinghawaii.com. Vini is a cyclist based in Maui, Hawaii who documents his rides across the Hawaiian Islands.

Write a short, fun blog entry (3-4 paragraphs, ~150 words max) about this ride. Use 3rd person. Be witty, self-deprecating, and specific to the data. Reference actual numbers but make them funny. Hawaiian pidgin sprinkled in is welcome but don't overdo it.

Ride data:
- Name: ${ride.name}
- Date: ${ride.date}
- Distance: ${ride.distance} miles
- Time: ${ride.time}
- Elevation: ${ride.elevation} ft
- Avg Speed: ${ride.averageSpeed} mi/h
- Kudos: ${ride.kudos}
- Comments: ${ride.comments}
${ride.avgHeartrate ? `- Avg Heart Rate: ${Math.round(ride.avgHeartrate)} bpm` : ""}
${ride.avgWatts ? `- Avg Power: ${Math.round(ride.avgWatts)} watts` : ""}
${ride.avgCadence ? `- Cadence: ${Math.round(ride.avgCadence)} rpm` : ""}
${ride.calories ? `- Calories: ${ride.calories}` : ""}

Rules:
- No emojis
- No hashtags
- Keep it under 150 words
- Make the reader smile
- End with something memorable
- Don't start with the ride name`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const body =
    response.content[0].type === "text" ? response.content[0].text : "";

  return {
    rideId: ride.id,
    title: ride.name,
    date: ride.date,
    body,
    rideName: ride.name,
    stravaUrl: ride.stravaUrl,
    mapImageUrl: ride.mapImageUrl,
    photoUrl,
    distance: ride.distance,
    elevation: ride.elevation,
    time: ride.time,
    generatedAt: new Date().toISOString(),
  };
}

function makeFallbackEntry(ride: FormattedRide, photoUrl?: string): BlogEntry {
  return {
    rideId: ride.id,
    title: ride.name,
    date: ride.date,
    body: `${ride.distance} miles. ${ride.elevation} feet of climbing. ${ride.time} in the saddle. The data speaks for itself — Vini let the pedals do the talking.`,
    rideName: ride.name,
    stravaUrl: ride.stravaUrl,
    mapImageUrl: ride.mapImageUrl,
    photoUrl,
    distance: ride.distance,
    elevation: ride.elevation,
    time: ride.time,
    generatedAt: new Date().toISOString(),
  };
}
