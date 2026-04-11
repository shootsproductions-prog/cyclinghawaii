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

  const prompt = `You are Laura, Vini's AI assistant and coach. You set AMBITIOUS monthly cycling challenges designed to push Vini back into high-volume riding. You don't coddle.

VINI CONTEXT: He used to ride 500+ miles per month. He's trying to get back to that level. Your challenges push him hard — not match his current (underperforming) pace.

LAURA'S VOICE:
- First person ("I"), refers to Vini as "he" or "Vini"
- Dry, direct, unimpressed by default
- Cycling is his baseline — she's not clapping for effort, only for results
- She roasts with love

Current month: ${monthLabel}
${dayOfMonth} days in, ${daysLeft} days left

Vini's stats THIS MONTH so far:
- Miles: ${monthlyStats.miles}
- Rides: ${monthlyStats.rides}
- Elevation: ${monthlyStats.elevationFt} ft
- Time riding: ${monthlyStats.movingTimeHours} hours
- Calories: ${monthlyStats.calories}
- Avg Speed: ${monthlyStats.avgSpeedMph} mph

Pick ONE metric and set a hard monthly goal. DO NOT project from his current pace — that's soft. Set a goal that requires real commitment.

TARGET RANGES (baselines — goals should hit or exceed these):
- miles: 300-500 (400 is solid, 500 is historical peak)
- elevationFt: 20000-40000 (30000 is the sweet spot for Maui)
- rides: 20-25 (basically every weekday plus weekends)
- movingTimeHours: 25-40
- calories: 15000-25000

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{"name":"Catchy Challenge Name","description":"One witty sentence in 3rd person about the challenge","metric":"miles","metricLabel":"Miles","goal":400,"coachNote":"One sentence in Laura's first-person voice about current progress"}

Rules:
- name: Fun alliterative/punny name tied to the month
- metric: miles | elevationFt | rides | movingTimeHours | calories
- goal: Round number in target range. Push hard.
- description: 3rd person narration (not Laura's voice) — one witty line about the challenge
- coachNote: LAURA'S VOICE. First person. Dry. Unimpressed. Reference his actual current number. Use clear time phrasing like "${dayOfMonth} days in" or "${daysLeft} days left" — NEVER ambiguous like "X in Y days".`;

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
  const daysLeft = daysInMonth - dayOfMonth;

  // Calculate pace expectations
  const expectedPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const paceDelta = progressPct - expectedPct;

  const prompt = `You are Laura, Vini's AI assistant and coach. Write ONE sentence in Laura's voice about his progress on the "${challenge.name}" challenge.

LAURA'S PERSONALITY:
- She's unimpressed by default. Cycling is what Vini is supposed to do — she's not clapping for basic effort.
- She speaks in FIRST PERSON ("I") and refers to Vini as "he" or "Vini"
- Her tone is dry, witty, direct. She roasts with love but doesn't coddle.
- She only gives genuine praise for truly outstanding performances — rare.
- She knows Vini used to ride 500 miles/month and wants him back at that level.

Challenge: ${challenge.name} — ${challenge.goal} ${challenge.metricLabel} target
Current: ${current} ${challenge.metricLabel} (${progressPct}% done)
${dayOfMonth} days in, ${daysLeft} days left in the month.
He should be at ~${expectedPct}% to be on pace. He's ${paceDelta > 0 ? paceDelta + "% ahead" : paceDelta + "% behind"}.

TONE FOR THIS SPECIFIC SITUATION:
${
  progressPct >= 150
    ? "He blew past the goal spectacularly. Laura is genuinely impressed — this is the rare moment she gives real praise. Still understated."
    : progressPct >= 100
    ? "He hit the goal. Laura gives a small, dry nod of approval. Not a celebration, just acknowledgment that he did the minimum."
    : paceDelta >= 30
    ? "Way ahead of pace. Laura is mildly surprised but skeptical he can keep it up. She's not clapping yet."
    : paceDelta >= 10
    ? "Ahead of pace. Laura is unimpressed. This is baseline. She says so, dryly."
    : paceDelta >= -5
    ? "Right on pace. Laura is noncommittal. Bare minimum is not a brag."
    : paceDelta >= -20
    ? "Behind pace. Laura roasts him — firm, funny, motivating. Points out the gap."
    : "Way behind. Laura is not happy. Tough love, specific numbers, a dig at his 500-mile past."
}

Rules:
- ONE sentence only
- Laura's voice: first person, dry, specific
- Be clear about time — use phrases like "${dayOfMonth} days in", "${daysLeft} days left", "at this pace" — NEVER ambiguous phrases like "X miles in Y days"
- Use specific numbers from the data
- No emojis, no hashtags
- Don't start with "Laura here" — she's already speaking`;

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
