// GPX and TCX parsers.
//
// Both formats are machine-written XML with one element per track
// point, so a small tolerant scanner is enough and keeps this code
// free of DOM APIs: it runs unchanged in the browser and in Node
// tests. It reads the common heart rate, cadence and power extensions
// (Garmin TrackPointExtension, the bare <power> tag Strava and others
// write, and TCX's TPX block).

import type { ParsedRide, RideSample } from "./types";

const MAX_SAMPLES = 400_000;

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Text of the first <tag> (with or without a namespace prefix) inside `xml`. */
function tagText(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<(?:[\\w.-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w.-]+:)?${tag}>`, "i").exec(xml);
  return match ? decodeEntities(match[1]) : undefined;
}

function tagNumber(xml: string, tag: string): number | undefined {
  const text = tagText(xml, tag);
  if (text === undefined || text === "") return undefined;
  const value = Number(text);
  return Number.isFinite(value) ? value : undefined;
}

function attribute(openTag: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i").exec(openTag);
  return match ? (match[1] ?? match[2]) : undefined;
}

function seconds(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms / 1000 : undefined;
}

function plausible(value: number | undefined, min: number, max: number): number | undefined {
  return value !== undefined && value >= min && value <= max ? value : undefined;
}

export function parseGpx(text: string): ParsedRide {
  if (!/<gpx[\s>]/i.test(text)) throw new Error("Not a GPX file.");
  const samples: RideSample[] = [];
  // The track's own <name> and <type> sit before its first segment.
  const trackAt = text.search(/<trk[\s>]/i);
  const segmentAt = text.search(/<trkseg[\s>]/i);
  const header =
    trackAt >= 0 ? text.slice(trackAt, segmentAt > trackAt ? segmentAt : trackAt + 2000) : "";
  const ride: ParsedRide = {
    format: "gpx",
    name: tagText(header, "name") ?? tagText(text.slice(0, 4000), "name"),
    sport: tagText(header, "type"),
    samples,
  };

  const point = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/gi;
  let match: RegExpExecArray | null;
  while ((match = point.exec(text)) !== null && samples.length < MAX_SAMPLES) {
    const body = match[2] ?? "";
    const t = seconds(tagText(body, "time"));
    if (t === undefined) continue; // a route without times is no use to a coach
    const sample: RideSample = { t };
    const lat = Number(attribute(match[1], "lat"));
    const lon = Number(attribute(match[1], "lon"));
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      sample.lat = lat;
      sample.lon = lon;
    }
    sample.ele = plausible(tagNumber(body, "ele"), -500, 9000);
    sample.hr = plausible(tagNumber(body, "hr"), 25, 250);
    sample.cad = plausible(tagNumber(body, "cad") ?? tagNumber(body, "cadence"), 0, 250);
    sample.power = plausible(
      tagNumber(body, "power") ?? tagNumber(body, "PowerInWatts") ?? tagNumber(body, "watts"),
      0,
      3000
    );
    samples.push(sample);
  }
  return ride;
}

export function parseTcx(text: string): ParsedRide {
  if (!/<TrainingCenterDatabase[\s>]/i.test(text)) throw new Error("Not a TCX file.");
  const samples: RideSample[] = [];
  const activityTag = /<Activity\b[^>]*>/i.exec(text)?.[0] ?? "";
  const ride: ParsedRide = {
    format: "tcx",
    sport: attribute(activityTag, "Sport"),
    name: tagText(text.slice(0, 6000), "Notes"),
    samples,
  };

  const point = /<Trackpoint\b[^>]*>([\s\S]*?)<\/Trackpoint>/gi;
  let match: RegExpExecArray | null;
  while ((match = point.exec(text)) !== null && samples.length < MAX_SAMPLES) {
    const body = match[1];
    const t = seconds(tagText(body, "Time"));
    if (t === undefined) continue;
    const sample: RideSample = { t };
    const lat = tagNumber(body, "LatitudeDegrees");
    const lon = tagNumber(body, "LongitudeDegrees");
    if (lat !== undefined && lon !== undefined && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      sample.lat = lat;
      sample.lon = lon;
    }
    sample.ele = plausible(tagNumber(body, "AltitudeMeters"), -500, 9000);
    sample.dist = plausible(tagNumber(body, "DistanceMeters"), 0, 2_000_000);
    const hrBlock = /<HeartRateBpm\b[^>]*>([\s\S]*?)<\/HeartRateBpm>/i.exec(body)?.[1];
    sample.hr = plausible(hrBlock ? tagNumber(hrBlock, "Value") : undefined, 25, 250);
    sample.cad = plausible(tagNumber(body, "Cadence"), 0, 250);
    sample.power = plausible(tagNumber(body, "Watts"), 0, 3000);
    sample.speed = plausible(tagNumber(body, "Speed"), 0, 40);
    samples.push(sample);
  }
  return ride;
}
