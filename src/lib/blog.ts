import Anthropic from "@anthropic-ai/sdk";
import { put, list } from "@vercel/blob";
import { FormattedFeaturedRide, FormattedRide } from "@/types/strava";
import { getAccessToken, getActivityPhotos } from "./strava";
import { generateAndSaveAudio } from "./voice";

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
  audioUrl?: string;
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

// How many existing entries we'll backfill audio for per render.
// Keeps each build under the timeout window.
const AUDIO_BACKFILL_BATCH = 5;

async function maybeGenerateAudio(
  rideId: number,
  text: string
): Promise<string | undefined> {
  if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
    return undefined;
  }
  const url = await generateAndSaveAudio(rideId, text);
  return url ?? undefined;
}

export async function generateBlogEntries(
  featured: FormattedFeaturedRide,
  rides: FormattedRide[]
): Promise<BlogEntry[]> {
  // Load existing archive
  const existingEntries = await loadEntries();
  const existingIds = new Set(existingEntries.map((e) => e.rideId));

  // Check EVERY ride in the feed, not just top 3 — so rides don't slip
  // through before being blogged. The archive should accumulate forever.
  const ridesToCheck = [featured, ...rides];
  const newRides = ridesToCheck.filter((r) => !existingIds.has(r.id));

  let dirty = false;

  if (newRides.length > 0) {
    console.log(`Generating ${newRides.length} new blog entries`);

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

      let entry: BlogEntry;
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          entry = await generateEntry(ride, photoUrl);
        } catch (error) {
          console.error(`Blog generation failed for ride ${ride.id}:`, error);
          entry = makeFallbackEntry(ride, photoUrl);
        }
      } else {
        entry = makeFallbackEntry(ride, photoUrl);
      }

      // Generate audio for the new entry
      try {
        entry.audioUrl = await maybeGenerateAudio(ride.id, entry.body);
      } catch (error) {
        console.error(`Audio generation failed for ride ${ride.id}:`, error);
      }

      existingEntries.push(entry);
      dirty = true;
    }
  }

  // Backfill audio for existing entries that don't have it yet.
  // Limit to N per render so builds don't time out.
  const needingAudio = existingEntries.filter((e) => !e.audioUrl);
  if (needingAudio.length > 0 && process.env.ELEVENLABS_API_KEY) {
    const batch = needingAudio.slice(0, AUDIO_BACKFILL_BATCH);
    console.log(
      `Backfilling audio for ${batch.length} entries (${
        needingAudio.length
      } remaining)`
    );
    for (const entry of batch) {
      try {
        const url = await maybeGenerateAudio(entry.rideId, entry.body);
        if (url) {
          entry.audioUrl = url;
          dirty = true;
        }
      } catch (error) {
        console.error(`Audio backfill failed for ride ${entry.rideId}:`, error);
      }
    }
  }

  if (dirty) {
    await saveEntries(existingEntries);
  }

  // Sort by rideId descending (Strava assigns IDs sequentially, so higher = newer)
  return [...existingEntries].sort((a, b) => b.rideId - a.rideId);
}

async function generateEntry(
  ride: FormattedRide | FormattedFeaturedRide,
  photoUrl?: string
): Promise<BlogEntry> {
  const prompt = `You are Laura, Vini's AI assistant and coach, writing a journal entry about his latest ride on cyclinghawaii.com.

LAURA'S VOICE:
- Third person about Vini ("he", "Vini"), but YOU are Laura narrating — occasionally first person asides are OK ("I told him...", "he didn't listen")
- Dry, witty, unimpressed by default. Cycling is his baseline, not an achievement.
- She roasts with love. Only rarely genuinely impressed — reserved for outstanding rides.
- She knows he used to ride 500 miles/month and wants him back there.
- Hawaiian references OK but sparingly.

Write a 3-4 paragraph entry (~150 words max) about this specific ride. Reference the actual numbers but make them funny. End with something memorable.

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
- No emojis, no hashtags
- Under 150 words
- Don't start with the ride name
- Don't start with "Laura here" — she's writing, not introducing
- Be specific with numbers. Laura reads the data.`;

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
