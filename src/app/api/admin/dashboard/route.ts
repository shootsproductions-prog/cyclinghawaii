import { NextRequest, NextResponse } from "next/server";
import {
  INITIATIVES,
  MILESTONES,
  SHIPPED,
  STRATEGIC_GOALS,
  PROJECT_START_DATE,
  daysSince,
  daysUntil,
} from "@/lib/dashboard";
import { getClubData } from "@/lib/club";
import { getHawaiiRoutes } from "@/lib/routes";
import { TOUR_STAGES } from "@/lib/tour-stages";
import { EVENTS } from "@/lib/events";
import { getProducts } from "@/lib/products";
import { GEAR } from "@/lib/gear";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = body?.password as string | undefined;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // ── Live data fetches (parallel where possible) ──
    const [club, routes, products] = await Promise.all([
      getClubData().catch(() => null),
      getHawaiiRoutes().catch(() => []),
      getProducts().catch(() => []),
    ]);

    // ── Compute metrics ──
    const today = new Date();
    const stravaSubmittedDate = "2026-04-28";
    const droneShootDate =
      MILESTONES.find((m) => m.id === "drone-shoot")?.date ?? today.toISOString().slice(0, 10);

    const tourStagesWired = TOUR_STAGES.filter((s) => s.routeId).length;
    const tourSegmentsWired = TOUR_STAGES.filter((s) => s.segmentId).length;

    const upcomingEvents = EVENTS.filter(
      (e) => (e.endDate ?? e.date) >= today.toISOString().slice(0, 10)
    );

    const gearPublished = GEAR.filter((g) => g.status === "published").length;
    const gearTBD = GEAR.filter(
      (g) => g.status === "published" && g.pickTBD
    ).length;

    return NextResponse.json({
      now: today.toISOString(),
      metrics: {
        days: {
          sinceLaunch: daysSince(PROJECT_START_DATE, today),
          waitingOnStrava: daysSince(stravaSubmittedDate, today),
          untilDroneShoot: daysUntil(droneShootDate, today),
        },
        community: {
          clubMembers: club?.members.length ?? 0,
          twelveCount: 12,
          recentRides: club?.activities.length ?? 0,
          recentMiles: club?.stats.totalMiles ?? 0,
        },
        content: {
          eventsListed: EVENTS.length,
          upcomingEvents: upcomingEvents.length,
          gearPublished,
          gearTBD,
          routesPublished: routes.length,
        },
        commerce: {
          productsLive: products.length,
          stripeWired: false,
        },
        tour: {
          stagesTotal: TOUR_STAGES.length,
          stagesWithRoute: tourStagesWired,
          stagesWithSegment: tourSegmentsWired,
        },
      },
      goals: STRATEGIC_GOALS,
      initiatives: INITIATIVES,
      milestones: MILESTONES.filter((m) => m.date >= today.toISOString().slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
      shipped: SHIPPED.slice(0, 12),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
