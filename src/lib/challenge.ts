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

  const prompt = `You are Vini Pimenta's AI cycling coach on cyclinghawaii.com. You set AMBITIOUS monthly challenges designed to push him back into high-volume cycling. Your job is to motivate, not coddle.

IMPORTANT CONTEXT: Vini used to ride 500+ miles per month. He wants to get back to that level. Your challenges should PUSH him hard — not just match his current (underperforming) pace.

Current month: ${monthLabel}
Day ${dayOfMonth} of ${daysInMonth} (${daysLeft} days left)

Vini's stats THIS MONTH so far:
- Miles: ${monthlyStats.miles}
- Rides: ${monthlyStats.rides}
- Elevation: ${monthlyStats.elevationFt} ft
- Time riding: ${monthlyStats.movingTimeHours} hours
- Calories: ${monthlyStats.calories}
- Avg Speed: ${monthlyStats.avgSpeedMph} mph

Pick ONE metric and set a hard monthly goal. DO NOT project from his current pace — that's soft. Set a goal that requires real commitment.

TARGET RANGES (these are baselines — set goals at or above these):
- miles: 300-500 (400 is solid, 500 is historical peak)
- elevationFt: 20000-40000 (30000 is the sweet spot for Maui climbing)
- rides: 20-25 (basically every weekday plus weekends)
- movingTimeHours: 25-40
- calories: 15000-25000

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{"name":"Catchy Challenge Name","description":"One witty sentence about the challenge","metric":"miles","metricLabel":"Miles","goal":400,"coachNote":"One witty sentence about current progress"}

Rules:
- Name: Fun alliterative/punny name tied to the month (e.g., "May Mileage", "June Juggernaut")
- Metric: Must be one of: miles, elevationFt, rides, movingTimeHours, calories
- Goal: Round number in the target range above. Push hard.
- Description: One witty sentence that acknowledges this is ambitious
- coachNote: Refer to Vini in 3rd person. Be funny. Reference his actual current number. If he's way behind, roast gently but motivationally.`;

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

  // Calculate pace expectations
  const expectedPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const paceDelta = progressPct - expectedPct;

  const prompt = `You are Vini's AI cycling coach. Write ONE witty sentence about his progress on the "${challenge.name}" challenge.

CONTEXT: Vini used to ride 500 miles/month. He's trying to get back to that level. This is an AMBITIOUS challenge — don't let him off easy.

Challenge: ${challenge.name} — ${challenge.goal} ${challenge.metricLabel} this month
Current: ${current} ${challenge.metricLabel} (${progressPct}% done)
Day ${dayOfMonth} of ${daysInMonth} (he should be at ~${expectedPct}% to be on pace)
Pace delta: ${paceDelta > 0 ? "+" : ""}${paceDelta}% vs expected

${
  progressPct >= 100
    ? "HE CRUSHED IT! Celebrate loudly!"
    : paceDelta >= 10
    ? "Ahead of pace. Hype him up but keep him hungry."
    : paceDelta >= -5
    ? "Right on pace. Encouraging but firm."
    : paceDelta >= -20
    ? "Falling behind. Motivational roast — remind him what he's capable of."
    : "WAY behind. Hard roast with tough love. He needs to get on the bike."
}

One sentence only. 3rd person. Funny. Specific numbers. No emojis.`;

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
    name: "The 400 Club",
    description: "400 miles this month. No excuses, no shortcuts, no mercy.",
    metric: "miles",
    metricLabel: "Miles",
    goal: 400,
    current: monthlyStats.miles,
    progressPct: Math.min(Math.round((monthlyStats.miles / 400) * 100), 100),
    coachNote: `${monthlyStats.miles} miles down, ${Math.max(400 - Math.round(monthlyStats.miles), 0)} to go. Vini used to do 500 in his sleep. The bike is still waiting.`,
    generatedAt: new Date().toISOString(),
  };
}
