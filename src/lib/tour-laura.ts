// Laura's Tour de Maui commentary — solo-rider mode included.

import type { TourStandings } from "./tour";
import type { TourStage } from "./tour-stages";

/** A line for the top of the Tour standings page. */
export function lauraTourHeadline(s: TourStandings): string {
  const month = new Date().toLocaleString("en-US", { month: "long" });

  if (s.totalCompletions === 0) {
    return `The ${s.year} Tour de Maui has begun. Zero stages completed. The peloton is suspiciously quiet.`;
  }

  if (s.uniqueAthletes === 1) {
    const r = s.ridersByStages[0];
    if (r.stagesCompleted === 1) {
      return `${r.firstname} just completed his first stage. He's leading. He's also last. We won't tell anyone.`;
    }
    if (r.stagesCompleted >= 12) {
      return `${r.firstname} has completed all 12 stages. The 2026 Tour is mathematically over. The peloton never showed.`;
    }
    return `${r.firstname} holds all four jerseys. Statistically impressive. Embarrassingly alone. Where is everyone? It's ${month}.`;
  }

  if (s.uniqueAthletes <= 3) {
    return `Three riders. Twelve stages. Tour de Maui ${s.year} is more of a Tour de Friendship right now. Standings real, drama imagined.`;
  }

  const leader = s.ridersByStages[0];
  return `${leader.firstname} leads the ${s.year} Tour de Maui with ${leader.stagesCompleted} stage${
    leader.stagesCompleted === 1 ? "" : "s"
  }. The yellow jersey is on. So is the pressure.`;
}

/** A short line for the current month's stage card. */
export function lauraMonthlyStageLine(stage: TourStage, count: number): string {
  if (stage.isLegendary) {
    if (count === 0) {
      return `${stage.name}. The legend stage. Nobody's finished it yet. Be the first. Or don't — it's not for everyone.`;
    }
    return `${stage.name}. ${count} have finished. They're not the same since.`;
  }
  if (stage.isSpecial) {
    if (count === 0) {
      return `Lanai is calling. Take the ferry. Bring the gravel tires. Tag #tdm-stage-5 on your way back.`;
    }
    return `${count} have made the Lanai pilgrimage this year. Pineapples were watching.`;
  }
  if (count === 0) {
    return `${stage.name}. This month's featured stage. No takers yet. ${stage.distanceMi} miles, ${stage.elevationFt.toLocaleString()} ft. Be honest about which one of those scares you.`;
  }
  return `${stage.name}. ${count} riders have completed it. Yours is forthcoming.`;
}

/** A roast line for an individual finisher (called per-completion in the future) */
export function lauraFinisherLine(stage: TourStage, firstname: string): string {
  if (stage.isLegendary) {
    return `${firstname} took on the ${stage.name}. Survived. Filed paperwork. Will not be the same.`;
  }
  if (stage.isSpecial) {
    return `${firstname} stamped the Lanai stage. Volcanic dust on the chamois. Worth it.`;
  }
  return `${firstname} took ${stage.name}. ${stage.distanceMi} miles. ${stage.elevationFt.toLocaleString()} ft. Logged. Witnessed. Roasted.`;
}
