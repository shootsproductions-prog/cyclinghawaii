import Anthropic from "@anthropic-ai/sdk";
import { put, list } from "@vercel/blob";
import { MonthlyStats } from "@/types/strava";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Challenge {
  month: string; // "2026-04"
  monthLabel: string; // "April 2026"
  name: string; // "Fly April"
  description: string; // witty description
  metric: string; // "miles" | "elevationFt" | "rides" | "movingTimeHours" | "calories"
  metricLabel: string; // "Miles" | "Elevation (ft)" etc.
  goal: number;
  current: number;
  progressPct: number;
  coachNote: string; // witty progress commentary
  generatedAt: string;
}

const BLOB_KEY = "challenge-current.json";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

async function loadChallenge(): Promise<Challenge | null> {
  try {
    const blobs = await list({ prefix: BLOB_KEY });
    if (blobs.blobs.length === 0) return null;
    const res = await fetch(blobs.blobs[0].url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function saveChallenge(challenge: Challenge): Promise<void> {
  try {
    await put(BLOB_KEY, JSON.stringify(challenge), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
  } catch (error) {
    console.error("Failed to save challenge:", error);
  }
}

export async function getChallenge(
  monthlyStats: MonthlyStats
): Promise<Challenge> {
  const currentMonth = getCurrentMonth();

  // Check if we already have a challenge for this month
  const existing = await loadChallenge();
  if (existing && existing.month === currentMonth) {
    // Update progress with current stats
    const current = getMetricValue(monthlyStats, existing.metric);
    const progressPct = Math.min(
      Math.round((current / existing.goal) * 100),
      100
    );

    // Generate fresh coach note based on progress
    let coachNote = existing.coachNote;
    try {
      if (process.env.ANTHROPIC_API_KEY) {
        coachNote = await generateCoachNote(existing, current, progressPct);
      }
    } catch {
      // Keep existing note
    }

    return { ...existing, current, progressPct, coachNote };
  }

  // Generate new challenge for this month
  if (!process.env.ANTHROPIC_API_KEY) {
    return getFallbackChallenge(monthlyStats);
  }

  try {
    const challenge = await generateChallenge(monthlyStats);
    await saveChallenge(challenge);
    return challenge;
  } catch (error) {
    console.error("Challenge generation failed:", error);
    return getFallbackChallenge(monthlyStats);
  }
}

function getMetricValue(stats: MonthlyStats, metric: string): number {
  switch (metric) {
    case "miles": return stats.miles;
    case "elevationFt": return stats.elevationFt;
    case "rides": return stats.rides;
    case "movingTimeHours": return stats.movingTimeHours;
    case "calories": return stats.calories;
    default: return stats.miles;
  }
}

async function generateChallenge(
  monthlyStats: MonthlyStats
): Promise<Challenge> {
  const monthLabel = getMonthLabel();
  const currentMonth = getCurrentMonth();
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysLeft = daysInMonth - dayOfMonth;

  const prompt = `You are Vini Pimenta's AI cycling coach on cyclinghawaii.com. You set monthly challenges that are ambitious but achievable based on his current stats.

Current month: ${monthLabel}
Day ${dayOfMonth} of ${daysInMonth} (${daysLeft} days left)

Vini's stats THIS MONTH so far:
- Miles: ${monthlyStats.miles}
- Rides: ${monthlyStats.rides}
- Elevation: ${monthlyStats.elevationFt} ft
- Time riding: ${monthlyStats.movingTimeHours} hours
- Calories: ${monthlyStats.calories}
- Avg Speed: ${monthlyStats.avgSpeedMph} mph

Pick ONE metric and set a challenging but achievable monthly goal. Project from his current pace — if he's at 50 miles on day 10, a 200-mile month goal would be ambitious but doable.

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{"name":"Catchy Challenge Name","description":"One witty sentence about the challenge","metric":"miles","metricLabel":"Miles","goal":200,"coachNote":"One witty sentence about current progress"}

Rules for the name: Make it a fun alliterative or punny name tied to the month (e.g., "April Avalanche", "May Madness").
Rules for metric: Must be one of: miles, elevationFt, rides, movingTimeHours, calories
Rules for goal: Must be a round number, achievable but requires effort.
Rules for coachNote: Refer to Vini in 3rd person, be funny, reference his actual current number.
Rules for description: One sentence, witty, describes the challenge.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  let text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  // Strip markdown code blocks if present
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  // Parse the JSON response
  const data = JSON.parse(text);
  const current = getMetricValue(monthlyStats, data.metric);
  const progressPct = Math.min(
    Math.round((current / data.goal) * 100),
    100
  );

  return {
    month: currentMonth,
    monthLabel,
    name: data.name,
    description: data.description,
    metric: data.metric,
    metricLabel: data.metricLabel,
    goal: data.goal,
    current,
    progressPct,
    coachNote: data.coachNote,
    generatedAt: new Date().toISOString(),
  };
}

async function generateCoachNote(
  challenge: Challenge,
  current: number,
  progressPct: number
): Promise<string> {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  const prompt = `You are Vini's AI cycling coach. Write ONE witty sentence about his progress on the "${challenge.name}" challenge.

Challenge: ${challenge.name} — ${challenge.goal} ${challenge.metricLabel} this month
Current: ${current} ${challenge.metricLabel} (${progressPct}% done)
Day ${dayOfMonth} of ${daysInMonth}

${progressPct >= 100 ? "HE CRUSHED IT! Celebrate!" : progressPct > 70 ? "He's close, push him!" : progressPct > 40 ? "He's on pace, keep it up." : "He's behind. Roast him gently."}

One sentence only. 3rd person. Funny. No emojis.`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 80,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].type === "text"
    ? response.content[0].text.trim()
    : challenge.coachNote;
}

function getFallbackChallenge(monthlyStats: MonthlyStats): Challenge {
  const currentMonth = getCurrentMonth();
  return {
    month: currentMonth,
    monthLabel: getMonthLabel(),
    name: "April Avalanche",
    description: "100 miles before the month runs out. The volcano isn't going to climb itself.",
    metric: "miles",
    metricLabel: "Miles",
    goal: 100,
    current: monthlyStats.miles,
    progressPct: Math.min(Math.round((monthlyStats.miles / 100) * 100), 100),
    coachNote: `${monthlyStats.miles} miles down. The bike is starting to wonder if Vini remembers it exists.`,
    generatedAt: new Date().toISOString(),
  };
}
