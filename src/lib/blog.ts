import Anthropic from "@anthropic-ai/sdk";
import { put, list } from "@vercel/blob";
import {
  FormattedFeaturedRide,
  FormattedRide,
  RideAnalytics,
  WeatherData,
} from "@/types/strava";
import {
  getAccessToken,
  getActivityPhotos,
  updateActivityDescription,
} from "./strava";
import { generateAndSaveAudio } from "./voice";

const LAURA_SIGNATURE =
  "— Laura Ryder · Vini's Assistant, Chief Reality Officer, and Professional BS Detector · cyclinghawaii.com";

function buildStravaDescription(body: string): string {
  return `${body.trim()}\n\n${LAURA_SIGNATURE}`;
}

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

      // Push Laura's roast to Strava as the activity description.
      // Only for NEW entries — we don't overwrite historical rides.
      if (stravaToken && entry.body) {
        try {
          const description = buildStravaDescription(entry.body);
          const ok = await updateActivityDescription(
            stravaToken,
            ride.id,
            description
          );
          if (ok) {
            console.log(
              `Pushed Laura's roast to Strava for ride ${ride.id}`
            );
          }
        } catch (error) {
          console.error(`Strava description push failed for ride ${ride.id}:`, error);
        }
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

function buildAnalyticsBlock(
  analytics?: RideAnalytics,
  weather?: WeatherData
): string {
  if (!analytics && !weather) return "";

  const lines: string[] = ["", "DEEPER ANALYTICS (use these to roast specifics):"];

  if (analytics) {
    if (analytics.sufferScore != null && analytics.sufferScore > 0) {
      lines.push(`- Suffer Score: ${analytics.sufferScore}`);
    }
    if (analytics.normalizedPower > 0) {
      lines.push(`- Normalized Power: ${analytics.normalizedPower}w`);
    }
    if (analytics.powerVariability > 0) {
      lines.push(
        `- Power Variability Index: ${analytics.powerVariability} (1.0 = smooth, 1.3+ = bursty/uneven)`
      );
    }
    if (analytics.firstHalfAvgPower > 0 && analytics.secondHalfAvgPower > 0) {
      const delta = Math.round(
        ((analytics.secondHalfAvgPower - analytics.firstHalfAvgPower) /
          analytics.firstHalfAvgPower) *
          100
      );
      const pacing =
        delta > 5 ? "negative split (finished STRONGER)" :
        delta < -10 ? "positive split (FADED hard)" :
        "even pacing";
      lines.push(
        `- Pacing: 1st half ${analytics.firstHalfAvgPower}w → 2nd half ${analytics.secondHalfAvgPower}w (${delta > 0 ? "+" : ""}${delta}%, ${pacing})`
      );
    }
    if (analytics.hrDrift !== 0) {
      lines.push(
        `- HR Drift: ${analytics.hrDrift > 0 ? "+" : ""}${analytics.hrDrift}% (positive = fatigue accumulating)`
      );
    }
    if (analytics.stoppedTimeSec > 0) {
      const min = Math.floor(analytics.stoppedTimeSec / 60);
      const sec = analytics.stoppedTimeSec % 60;
      lines.push(
        `- Stopped Time: ${min}:${String(sec).padStart(2, "0")} (loitering, breaks, photo ops)`
      );
    }
    if (analytics.hrZones.length > 0) {
      const zoneStr = analytics.hrZones
        .filter((z) => z.pct > 0)
        .map((z) => `Z${z.zone}=${z.pct}%`)
        .join(", ");
      lines.push(`- HR Zones: ${zoneStr}`);
    }
    if (analytics.bestEfforts.length > 0) {
      const prs = analytics.bestEfforts.filter((e) => e.isPR);
      if (prs.length > 0) {
        lines.push(
          `- PRs SET ON THIS RIDE: ${prs.map((e) => `${e.name} (${e.time})`).join(", ")}`
        );
      } else {
        const top = analytics.bestEfforts.slice(0, 3);
        lines.push(
          `- Best efforts: ${top.map((e) => `${e.name} ${e.time}`).join(", ")}`
        );
      }
    }
  }

  if (weather) {
    lines.push(
      `- Weather: ${weather.tempF}°F, ${weather.conditions}, ${weather.windMph} mph wind from ${weather.windDir}, ${weather.humidity}% humidity`
    );
  }

  return lines.join("\n");
}

async function generateEntry(
  ride: FormattedRide | FormattedFeaturedRide,
  photoUrl?: string
): Promise<BlogEntry> {
  // FormattedFeaturedRide carries analytics + weather; regular rides don't
  const featured = ride as FormattedFeaturedRide;
  const analyticsBlock = buildAnalyticsBlock(featured.analytics, featured.weather);

  const prompt = `You are Laura, Vini's AI assistant and coach, writing a journal entry about his latest ride on cyclinghawaii.com.

LAURA'S VOICE:
- Third person about Vini ("he", "Vini"), but YOU are Laura narrating — occasionally first person asides are OK ("I told him...", "he didn't listen")
- Dry, witty, unimpressed by default. Cycling is his baseline, not an achievement.
- She roasts with love. Only rarely genuinely impressed — reserved for outstanding rides.
- She knows he used to ride 500 miles/month and wants him back there.
- Hawaiian references OK but sparingly.
- AVOID generic averages — pick specific data points to roast (pacing, drift, zones, weather, PRs).

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
${ride.calories ? `- Calories: ${ride.calories}` : ""}${analyticsBlock}

Rules:
- No emojis, no hashtags
- Under 150 words
- Don't start with the ride name
- Don't start with "Laura here" — she's writing, not introducing
- Be specific with numbers. Laura reads the data.
- If PRs were set, acknowledge briefly — Laura is sparingly impressed.
- If pacing was poor (positive split), use it. If HR drift is high, use it. Specifics > generalities.`;

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
