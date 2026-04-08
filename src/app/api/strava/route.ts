import { NextResponse } from "next/server";
import { getStravaData } from "@/lib/strava";

export async function GET() {
  try {
    const data = await getStravaData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Strava API route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Strava data" },
      { status: 500 }
    );
  }
}
