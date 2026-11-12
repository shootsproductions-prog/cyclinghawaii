// ─────────────────────────────────────────────────────────────────────
//  FIT TARGET RANGES. The one file to edit when tuning the fit tool.
// ─────────────────────────────────────────────────────────────────────
//
// Every number the assessment compares against lives here, next to the
// source it came from. Nothing else in the codebase hard-codes a range.
//
// How to read a range:
//   min / max   the band we call "in range" for that riding style
//   aim         where a change should head (used to size adjustments)
//
// A reading has to sit outside the band by more than the measurement
// tolerance below before the tool recommends changing anything.
//
// IMPORTANT caveats that apply to every number here:
//   - These are population ranges from fitting practice and research,
//     not targets for any one body. Comfort and pain trump the chart.
//   - Sources define and measure angles differently (marker placement,
//     2D vs 3D, posed vs pedalling). See the per-measurement notes.
//   - The research base is solid for the knee at the bottom of the
//     stroke and thin for the hip, shoulder and elbow (Swart & Holliday
//     2019 say exactly this). Those upper-body bands are fitter
//     convention and are deliberately wide.

import type { CaptureMode, MeasurementId, RidingStyle } from "./types";

/**
 * Hand-placed points on a 2D frame are good to a few degrees at best.
 * Fonda et al. 2014 found 2D video valid for the knee angle; reviews
 * report it reading 2 to 3 degrees lower than 3D capture. A reading
 * within this many degrees of a band edge is "borderline": shown, but
 * not acted on.
 */
export const TOLERANCE_DEG = 3;

/** Same idea for the knee-over-pedal offset, which is sensitive to camera tilt. */
export const TOLERANCE_MM = 15;

/** Crank length assumed until the rider confirms theirs. The most common road size. */
export const DEFAULT_CRANK_LENGTH_MM = 172.5;

/** Largest single change the tool will ask for before a re-shoot. */
export const MAX_SADDLE_STEP_MM = 5;

/**
 * Fallback when no crank is marked, so there is no scale: size the
 * saddle change for an average adult leg. Thigh and shank are each
 * about a quarter of standing height (0.245 and 0.246 in the standard
 * anthropometric tables), so roughly 430 mm for a 1.75 m rider. Around
 * the target knee angle that works out near 2.5 mm of saddle height
 * per degree; see geometry.legExtension.
 */
export const AVERAGE_LEG_MM = { thighMm: 430, shankMm: 430 };

export type SourceId =
  | "holmes1994"
  | "bini2011"
  | "silberman2005"
  | "ferrerRoca2012"
  | "biniHume2016"
  | "fonda2014"
  | "millour2023"
  | "hollidaySwart2021"
  | "swartHolliday2019"
  | "velogic"
  | "pedalyze"
  | "bikeFitAdviser"
  | "bontragerKops"
  | "cyclingWeeklyGravel";

export interface Source {
  citation: string;
  url?: string;
  /** What we took from it. */
  used: string;
}

export const SOURCES: Record<SourceId, Source> = {
  holmes1994: {
    citation:
      "Holmes JC, Pruitt AL, Whalen NJ. Lower extremity overuse in bicycling. Clinics in Sports Medicine. 1994;13:187-203.",
    used: "The classic static goniometer target: 25 to 35 degrees of knee flexion at the bottom of the stroke.",
  },
  bini2011: {
    citation:
      "Bini R, Hume PA, Croft JL. Effects of bicycle saddle height on knee injury risk and cycling performance. Sports Medicine. 2011;41:463-476.",
    url: "https://pubmed.ncbi.nlm.nih.gov/21615188/",
    used: "Review supporting a knee-flexion method (25 to 30 degrees) for setting saddle height, and noting the evidence is mixed.",
  },
  silberman2005: {
    citation:
      "Silberman MR, Webner D, Collina S, Shiple BJ. Road bicycle fit. Clinical Journal of Sport Medicine. 2005;15(4):271-276.",
    url: "https://pubmed.ncbi.nlm.nih.gov/16003043/",
    used: "Clinical fit guide; the 25 to 35 degree static knee range and the standard order of adjustments.",
  },
  ferrerRoca2012: {
    citation:
      "Ferrer-Roca V, Roig A, Galilea P, Garcia-Lopez J. Influence of saddle height on lower limb kinematics in well-trained cyclists: static vs. dynamic evaluation in bike fitting. Journal of Strength and Conditioning Research. 2012;26(11):3025-3029.",
    url: "https://pubmed.ncbi.nlm.nih.gov/22190163/",
    used: "The pedalling (dynamic 2D video) knee target: 30 to 40 degrees of flexion.",
  },
  biniHume2016: {
    citation:
      "Bini RR, Hume P. A comparison of static and dynamic measures of lower limb joint angles in cycling: application to bicycle fitting. Human Movement. 2016;17(1):36-42.",
    url: "https://doi.org/10.1515/humo-2016-0005",
    used: "Posed and pedalling angles differ at 6 o'clock: about 8 degrees at the knee, 5 at the hip, 9 at the ankle.",
  },
  fonda2014: {
    citation:
      "Fonda B, Sarabon N, Li FX. Validity and reliability of different kinematics methods used for bike fitting. Journal of Sports Sciences. 2014;32(10):940-946.",
    url: "https://pubmed.ncbi.nlm.nih.gov/24499342/",
    used: "2D video is a valid, repeatable way to measure the knee angle while pedalling, with a small offset from 3D capture.",
  },
  millour2023: {
    citation:
      "Millour G, Velasquez AT, Domingue F. A literature overview of modern biomechanical-based technologies for bike-fitting professionals and coaches. International Journal of Sports Science & Coaching. 2023;18(1):292-303.",
    url: "https://journals.sagepub.com/doi/10.1177/17479541221123960",
    used: "Review: 2D analysis is reliable in the side view; knee angle reads 2 to 3 degrees lower than 3D.",
  },
  hollidaySwart2021: {
    citation:
      "Holliday W, Swart J. Anthropometrics, flexibility and training history as determinants for bicycle configuration. Sports Medicine and Health Science. 2021;3(2):93-100.",
    url: "https://pubmed.ncbi.nlm.nih.gov/35782160/",
    used: "What 50 trained cyclists actually ride: knee 36 +/- 7 degrees, elbow flexion 19 +/- 8 degrees.",
  },
  swartHolliday2019: {
    citation:
      "Swart J, Holliday W. Cycling biomechanics optimization: the (r)evolution of bicycle fitting. Current Sports Medicine Reports. 2019;18(12):490-496.",
    url: "https://pubmed.ncbi.nlm.nih.gov/31834181/",
    used: "Review noting how little the hip, shoulder and elbow have been studied. The reason our upper-body bands are wide.",
  },
  velogic: {
    citation: "Velogic Studio documentation: Road metrics (motion-capture fit software reference ranges).",
    url: "https://docs.velogicfit.com/section-02-using-velogic-studio/road-metrics",
    used: "Knee 140 to 145 degrees at full extension and above 68 at the top, torso 35 to 40 (racing) or 40 to 50 (general), shoulder 75 to 100, elbow 155 to 170, ankle 100 to 130 with under 30 of travel, knee 0 to 40 mm behind the foot marker.",
  },
  pedalyze: {
    citation: "Pedalyze: Road bike fit angles reference chart, and KOPS explained.",
    url: "https://pedalyze.bike/en/guides/road-bike-fit-angles",
    used: "Cross-check for hoods position: torso 40 to 55, shoulder 80 to 100, elbow 150 to 165, hip 45 to 75 degrees.",
  },
  bikeFitAdviser: {
    citation: "Bike Fit Adviser: A (not so) basic bike fit, part 3: bike fit joint angles.",
    url: "https://www.bikefitadviser.com/blog/not-basic-bike-fit-part-3-bike-fit-joint-angles",
    used: "About 118 degrees of knee flexion at the top of the stroke as the borderline for too much.",
  },
  bontragerKops: {
    citation: "Bontrager K. The myth of K.O.P.S. (hosted by Sheldon Brown).",
    url: "https://www.sheldonbrown.com/kops.html",
    used: "Knee-over-pedal-spindle has no biomechanical basis as a rule. We treat it as a starting reference only.",
  },
  cyclingWeeklyGravel: {
    citation: "Cycling Weekly: Do you need a gravel-specific bike fit?",
    url: "https://cyclingweekly.com/fitness/do-i-need-a-gravel-specific-bike-fit",
    used: "Fitters start a gravel fit from the road fit and bias it slightly taller and shorter for control off-road.",
  },
};

export interface Range {
  min?: number;
  max?: number;
  aim: number;
}

export interface MeasurementSpec {
  id: MeasurementId;
  label: string;
  /** One-line plain-language meaning, shown under the number. */
  meaning: string;
  unit: "deg" | "mm";
  ranges: Record<RidingStyle, Range>;
  /** Overrides for a posed, stationary photo, where it matters. */
  staticRanges?: Record<RidingStyle, Range>;
  /** Shown for reference only; never drives a recommendation. */
  informational: boolean;
  sources: SourceId[];
  note: string;
}

const same = (r: Range): Record<RidingStyle, Range> => ({
  endurance: r,
  performance: r,
  gravel: r,
});

export const SPECS: Record<MeasurementId, MeasurementSpec> = {
  kneeBottom: {
    id: "kneeBottom",
    label: "Knee bend at the bottom",
    meaning: "How far the knee is from straight with the pedal at its lowest. The saddle-height number.",
    unit: "deg",
    // Pedalling, 2D video: 30 to 40 degrees (Ferrer-Roca 2012). Same
    // band for every style because saddle height is about the leg,
    // not the riding position. Gravel aims a degree lower in the
    // saddle for control on rough ground.
    ranges: {
      endurance: { min: 30, max: 40, aim: 35 },
      performance: { min: 30, max: 40, aim: 34 },
      gravel: { min: 30, max: 40, aim: 36 },
    },
    // Posed still photo: the classic goniometer band (Holmes 1994).
    // Pedalling reads about 8 degrees more flexed (Bini & Hume 2016),
    // which is why the two bands differ.
    staticRanges: same({ min: 25, max: 35, aim: 30 }),
    informational: false,
    sources: ["ferrerRoca2012", "holmes1994", "bini2011", "biniHume2016", "hollidaySwart2021", "fonda2014"],
    note: "30 to 40 degrees applies to frames taken while pedalling. A posed photo uses 25 to 35.",
  },
  kneeTop: {
    id: "kneeTop",
    label: "Knee bend at the top",
    meaning: "How tightly the knee folds with the pedal at its highest. Too much loads the front of the knee.",
    unit: "deg",
    // Velogic: knee angle stays above 68 degrees (112 of flexion).
    // Bike Fit Adviser: about 118 of flexion is borderline. We take
    // the middle and let the tolerance cover the rest.
    ranges: same({ max: 115, aim: 108 }),
    informational: false,
    sources: ["velogic", "bikeFitAdviser"],
    note: "A high number here with a good number at the bottom usually points at crank length, not saddle height.",
  },
  hipTop: {
    id: "hipTop",
    label: "Hip angle at the top",
    meaning: "The angle between torso and thigh when the knee comes up. Small numbers mean a cramped hip.",
    unit: "deg",
    ranges: {
      endurance: { min: 50, max: 75, aim: 58 },
      performance: { min: 45, max: 65, aim: 52 },
      gravel: { min: 50, max: 75, aim: 58 },
    },
    informational: false,
    sources: ["pedalyze", "swartHolliday2019"],
    note: "Fitter convention (45 to 75 degrees on the hoods), not a research-validated band.",
  },
  hipBottom: {
    id: "hipBottom",
    label: "Hip angle at the bottom",
    meaning: "Torso to thigh with the leg extended. For reference.",
    unit: "deg",
    ranges: same({ min: 90, max: 110, aim: 100 }),
    informational: true,
    sources: ["velogic"],
    note: "Velogic lists a maximum hip angle of 90 to 105 degrees for road positions.",
  },
  torso: {
    id: "torso",
    label: "Torso angle",
    meaning: "How far the back leans forward. 0 would be flat, 90 bolt upright.",
    unit: "deg",
    // Velogic: 35 to 40 racing, 40 to 50 general, 50+ rare.
    // Pedalyze: 40 to 55 on the hoods. Gravel starts from the
    // endurance band, nudged upright.
    ranges: {
      endurance: { min: 40, max: 50, aim: 45 },
      performance: { min: 33, max: 42, aim: 38 },
      gravel: { min: 40, max: 52, aim: 46 },
    },
    informational: false,
    sources: ["velogic", "pedalyze", "cyclingWeeklyGravel"],
    note: "Measured from the hip point to the shoulder point with hands on the hoods.",
  },
  shoulder: {
    id: "shoulder",
    label: "Shoulder angle",
    meaning: "Torso to upper arm. Near 90 the arms prop the body without reaching.",
    unit: "deg",
    ranges: {
      endurance: { min: 78, max: 92, aim: 87 },
      performance: { min: 80, max: 100, aim: 90 },
      gravel: { min: 78, max: 92, aim: 87 },
    },
    informational: false,
    sources: ["velogic", "pedalyze", "swartHolliday2019"],
    note: "Above the band means reaching for the bars; below it means cramped.",
  },
  elbow: {
    id: "elbow",
    label: "Elbow bend",
    meaning: "How far the elbow is from locked straight. A soft bend absorbs the road.",
    unit: "deg",
    ranges: {
      endurance: { min: 15, max: 30, aim: 20 },
      performance: { min: 15, max: 35, aim: 25 },
      gravel: { min: 15, max: 35, aim: 25 },
    },
    informational: false,
    sources: ["velogic", "pedalyze", "hollidaySwart2021"],
    note: "Sources quote the full elbow angle (150 to 170); we show the bend, which is 180 minus that.",
  },
  ankleBottom: {
    id: "ankleBottom",
    label: "Ankle angle at the bottom",
    meaning: "Shin to foot. A big number is a toe pointing down, often reaching for the pedal.",
    unit: "deg",
    // Velogic: 100 to 130 through the stroke, measured to a marker on
    // the side of the foot. Our toe-tip point reads roughly 5 degrees
    // bigger, so the band is shifted to match.
    ranges: same({ min: 100, max: 135, aim: 120 }),
    informational: true,
    sources: ["velogic", "biniHume2016"],
    note: "Pedalling styles differ a lot. Used only as supporting evidence for saddle height.",
  },
  ankleRange: {
    id: "ankleRange",
    label: "Ankle movement",
    meaning: "How much the ankle angle changes between top and bottom of the stroke.",
    unit: "deg",
    ranges: same({ max: 30, aim: 20 }),
    informational: true,
    sources: ["velogic"],
    note: "Velogic lists under 30 degrees of ankle travel.",
  },
  kops: {
    id: "kops",
    label: "Knee over pedal axle",
    meaning: "With the crank level and forward: knee ahead of (+) or behind (-) the pedal axle.",
    unit: "mm",
    // Our knee point is the joint centre on the side of the knee, not
    // the front of the kneecap that a plumb line uses, so "neutral"
    // sits a little behind the axle. Velogic: knee 0 to 40 mm behind
    // the foot marker for road.
    ranges: same({ min: -40, max: 0, aim: -20 }),
    informational: false,
    sources: ["velogic", "pedalyze", "bontragerKops"],
    note: "A starting reference, not a rule. Very sensitive to a tilted camera.",
  },
};

/** Display and assessment order. */
export const MEASUREMENT_ORDER: MeasurementId[] = [
  "kneeBottom",
  "kneeTop",
  "kops",
  "hipTop",
  "torso",
  "shoulder",
  "elbow",
  "hipBottom",
  "ankleBottom",
  "ankleRange",
];

export const STYLES: Record<RidingStyle, { label: string; blurb: string }> = {
  endurance: {
    label: "Endurance road",
    blurb: "Long days, comfort first. Hands on the hoods, relaxed upper body.",
  },
  performance: {
    label: "Performance road",
    blurb: "Lower and longer for speed. Needs hamstring and hip flexibility to hold.",
  },
  gravel: {
    label: "Gravel",
    blurb: "Close to an endurance fit, a touch taller and shorter for control on rough ground.",
  },
};

export function rangeFor(
  id: MeasurementId,
  style: RidingStyle,
  mode: CaptureMode
): Range {
  const spec = SPECS[id];
  if (mode === "static" && spec.staticRanges) return spec.staticRanges[style];
  return spec.ranges[style];
}

export function toleranceFor(id: MeasurementId): number {
  return SPECS[id].unit === "mm" ? TOLERANCE_MM : TOLERANCE_DEG;
}
