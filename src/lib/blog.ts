import Anthropic from "@anthropic-ai/sdk";
import { FormattedFeaturedRide, FormattedRide } from "@/types/strava";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface BlogEntry {
  rideId: number;
  title: string;
  date: string;
  body: string;
  rideName: string;
  stravaUrl: string;
  mapImageUrl: string;
  distance: string;
  elevation: string;
  time: string;
}

export async function generateBlogEntries(
  featured: FormattedFeaturedRide,
  rides: FormattedRide[]
): Promise<BlogEntry[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return getFallbackEntries();
  }

  // Generate for featured + up to 2 recent rides (3 total)
  const ridesToBlog = [featured, ...rides.slice(0, 2)];
  const entries: BlogEntry[] = [];

  for (const ride of ridesToBlog) {
    try {
      const entry = await generateEntry(ride);
      entries.push(entry);
    } catch (error) {
      console.error(`Blog generation failed for ride ${ride.id}:`, error);
      entries.push(makeFallbackEntry(ride));
    }
  }

  return entries;
}

async function generateEntry(
  ride: FormattedRide | FormattedFeaturedRide
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
    distance: ride.distance,
    elevation: ride.elevation,
    time: ride.time,
  };
}

function makeFallbackEntry(ride: FormattedRide): BlogEntry {
  return {
    rideId: ride.id,
    title: ride.name,
    date: ride.date,
    body: `${ride.distance} miles. ${ride.elevation} feet of climbing. ${ride.time} in the saddle. The data speaks for itself — Vini let the pedals do the talking.`,
    rideName: ride.name,
    stravaUrl: ride.stravaUrl,
    mapImageUrl: ride.mapImageUrl,
    distance: ride.distance,
    elevation: ride.elevation,
    time: ride.time,
  };
}

function getFallbackEntries(): BlogEntry[] {
  return [
    {
      rideId: 1,
      title: "Haleakala Sunrise Bomb",
      date: "Apr 4, 2026",
      body: "36.2 miles of pure gravity. Vini pointed the bike downhill from 10,000 feet and held on. Average speed suggests he was either very aerodynamic or slightly terrified. The 9,740 feet of elevation gain on the way up? We don't talk about that part.",
      rideName: "Haleakala Sunrise Bomb",
      stravaUrl: "#",
      mapImageUrl: "",
      distance: "36.2",
      elevation: "9,740",
      time: "1:48",
    },
  ];
}
