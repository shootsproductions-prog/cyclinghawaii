import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseRideFile } from "../parsers";
import { FitParseError, parseFit } from "../parsers/fit";
import { parseGpx, parseTcx } from "../parsers/xml";
import { bestAverage, haversine, localStamp, normalizedPower, summarizeRide } from "../summarize";

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

// ─────────────────────────────────────────────────────────────────────
// FIT, against a file written by Garmin's official SDK encoder
// (scripts used to build it are described in the fixture's commit).
// The ride is synthetic: 600 one-second records following these formulas.
// ─────────────────────────────────────────────────────────────────────
const START = Date.parse("2026-10-04T17:30:00Z") / 1000;
const expected = (i: number) => ({
  hr: 120 + Math.round(25 * Math.sin(i / 60)),
  cad: i % 150 < 10 ? 0 : 78 + (i % 7),
  power: i % 150 < 10 ? 0 : i % 120 < 60 ? 150 : 250,
  speed: 6 + (i % 10) * 0.1,
  ele: 100 + i * 0.25,
  lat: 20.8 + i * 0.00005,
  lon: -156.33 + i * 0.00002,
});

describe("FIT decoder against a file from Garmin's own encoder", () => {
  const file = readFileSync(join(__dirname, "fixtures", "garmin-sdk-ride.fit"));
  const ride = parseFit(toArrayBuffer(file));

  it("reads every record with the right timestamp", () => {
    expect(ride.samples).toHaveLength(600);
    expect(ride.samples[0].t).toBe(START);
    expect(ride.samples[599].t).toBe(START + 599);
  });

  it("decodes heart rate, cadence, power, speed, altitude and position", () => {
    for (const i of [0, 1, 9, 10, 59, 60, 149, 150, 299, 437, 599]) {
      const s = ride.samples[i];
      const e = expected(i);
      expect(s.hr, `hr @${i}`).toBe(e.hr);
      // The encoder leaves out a zero-cadence/zero-power sample only if invalid; zero is valid.
      expect(s.cad, `cad @${i}`).toBe(e.cad);
      expect(s.power, `power @${i}`).toBe(e.power);
      expect(s.speed!, `speed @${i}`).toBeCloseTo(e.speed, 3);
      // FIT stores altitude in 0.2 m steps.
      expect(Math.abs(s.ele! - e.ele), `ele @${i}`).toBeLessThanOrEqual(0.11);
      expect(s.lat!, `lat @${i}`).toBeCloseTo(e.lat, 6);
      expect(s.lon!, `lon @${i}`).toBeCloseTo(e.lon, 6);
    }
  });

  it("accumulates distance as written", () => {
    let distance = 0;
    for (let i = 1; i < 600; i++) distance += expected(i).speed;
    expect(ride.samples[599].dist!).toBeCloseTo(distance, 1);
  });

  it("reads the session summary and sport", () => {
    expect(ride.sport).toBe("cycling");
    expect(ride.subSport).toBe("gravel_cycling");
    expect(ride.session?.startTime).toBe(START);
    expect(ride.session?.elapsedSec).toBeCloseTo(599, 2);
    expect(ride.session?.ascentM).toBe(150);
    expect(ride.session?.avgHr).toBe(121);
    expect(ride.session?.maxHr).toBe(145);
    expect(ride.session?.normPower).toBe(205);
  });

  it("is picked up by format sniffing, whatever the file is called", () => {
    expect(parseRideFile(toArrayBuffer(file)).format).toBe("fit");
  });

  it("summarises to sensible ride totals", () => {
    const result = summarizeRide(ride, { id: "x", fallbackName: "Morning ride", utcOffsetMin: -600 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const r = result.ride;
    expect(r.start).toBe("2026-10-04T07:30:00"); // Honolulu local time
    expect(r.kind).toBe("gravel");
    expect(r.name).toBe("Morning ride");
    expect(r.movingSec).toBe(599);
    expect(r.distanceM).toBeGreaterThan(3850);
    expect(r.distanceM).toBeLessThan(3880);
    expect(r.climbM).toBe(150); // the device's own figure wins
    expect(r.avgHr).toBeGreaterThan(118);
    expect(r.avgHr).toBeLessThan(126);
    expect(r.maxHr).toBe(145);
    expect(r.powerMeasured).toBe(true);
    // 150 W and 250 W alternating a minute at a time, with short zero gaps.
    expect(r.avgPower).toBeGreaterThan(180);
    expect(r.avgPower).toBeLessThan(200);
    expect(r.normPower!).toBeGreaterThan(r.avgPower!);
    expect(r.peaks?.s5).toBe(250);
    expect(r.peaks?.m1).toBeGreaterThan(230);
    expect(r.peaks?.m20).toBeUndefined(); // a 10 minute ride has no 20 minute best
    expect(r.avgCadence).toBeGreaterThan(78);
    expect(r.avgCadence).toBeLessThan(85);
    expect(r.indoor).toBe(false);
    expect(r.hrHist!.reduce((s, v) => s + v, 0)).toBe(599);
    expect(r.powerHist!.reduce((s, v) => s + v, 0)).toBe(599);
  });
});

// ─────────────────────────────────────────────────────────────────────
// FIT edge cases, built byte by byte from the protocol description.
// ─────────────────────────────────────────────────────────────────────
function fitFile(records: number[], headerSize: 12 | 14 = 14): ArrayBuffer {
  const header = new Uint8Array(headerSize);
  const view = new DataView(header.buffer);
  header[0] = headerSize;
  header[1] = 0x20;
  view.setUint16(2, 2100, true);
  view.setUint32(4, records.length, true);
  header.set([0x2e, 0x46, 0x49, 0x54], 8);
  const out = new Uint8Array(headerSize + records.length + 2);
  out.set(header, 0);
  out.set(records, headerSize);
  return toArrayBuffer(out);
}

const u16be = (v: number) => [(v >> 8) & 0xff, v & 0xff];
const u32be = (v: number) => [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff];
const u32le = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];

describe("FIT decoder edge cases", () => {
  const T0 = 1_150_000_000; // FIT seconds

  it("handles big-endian definitions, invalid values, developer fields and a 12 byte header", () => {
    const records = [
      // Definition, local 0, with developer data: record (20), big endian,
      // fields: timestamp u32, heart_rate u8, power u16; one 3-byte developer field.
      0x60, 0, 1, ...u16be(20), 3, 253, 4, 0x86, 3, 1, 0x02, 7, 2, 0x84, 1, 0, 3, 0,
      // Data: t, hr 141, power 212, then 3 developer bytes to skip
      0x00, ...u32be(T0), 141, ...u16be(212), 9, 9, 9,
      // Data: hr invalid (0xFF), power invalid (0xFFFF)
      0x00, ...u32be(T0 + 1), 0xff, 0xff, 0xff, 1, 2, 3,
      // Definition for an unknown message (global 999), local 1, little endian, one 2-byte field
      0x41, 0, 0, 0xe7, 0x03, 1, 0, 2, 0x84,
      // Its data: must be skipped without disturbing anything
      0x01, 0x34, 0x12,
      0x00, ...u32be(T0 + 2), 150, ...u16be(0), 0, 0, 0,
    ];
    const ride = parseFit(fitFile(records, 12));
    expect(ride.samples).toHaveLength(3);
    expect(ride.samples[0]).toMatchObject({ t: T0 + 631065600, hr: 141, power: 212 });
    expect(ride.samples[1].hr).toBeUndefined();
    expect(ride.samples[1].power).toBeUndefined();
    expect(ride.samples[2]).toMatchObject({ hr: 150, power: 0 });
  });

  it("rebuilds timestamps from compressed-timestamp headers, including rollover", () => {
    const base = (T0 & ~0x1f) + 29; // 5 low bits = 29
    const records = [
      // Definition local 0: record with timestamp + heart rate
      0x40, 0, 0, 20, 0, 2, 253, 4, 0x86, 3, 1, 0x02,
      0x00, ...u32le(base), 100,
      // Definition local 1: record with heart rate only (time comes from the header)
      0x41, 0, 0, 20, 0, 1, 3, 1, 0x02,
      0x80 | (1 << 5) | 31, 101, // offset 31: +2 s
      0x80 | (1 << 5) | 1, 102, // offset 1 < 31: rolled over, +2 s
      0x80 | (1 << 5) | 4, 103, // +3 s
    ];
    const ride = parseFit(fitFile(records));
    expect(ride.samples.map((s) => s.t - 631065600 - base)).toEqual([0, 2, 4, 7]);
    expect(ride.samples.map((s) => s.hr)).toEqual([100, 101, 102, 103]);
  });

  it("stops cleanly on a truncated file instead of throwing", () => {
    const records = [0x40, 0, 0, 20, 0, 2, 253, 4, 0x86, 3, 1, 0x02, 0x00, ...u32le(T0), 120, 0x00, 1, 2];
    expect(parseFit(fitFile(records)).samples).toHaveLength(1);
  });

  it("rejects files that are not FIT", () => {
    expect(() => parseFit(new Uint8Array(40).buffer)).toThrow(FitParseError);
    expect(() => parseRideFile(new TextEncoder().encode("hello, this is a text file").buffer as ArrayBuffer)).toThrow(
      /Not a FIT, GPX or TCX/
    );
    expect(() => parseRideFile(new Uint8Array([0x1f, 0x8b, 8, 0, 0, 0]).buffer)).toThrow(/compressed/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// GPX and TCX
// ─────────────────────────────────────────────────────────────────────
const GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="StravaGPX" version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
 <metadata><time>2026-10-04T17:30:00Z</time></metadata>
 <trk>
  <name>Makawao &amp; back</name>
  <type>cycling</type>
  <trkseg>
   <trkpt lat="20.8000000" lon="-156.3300000"><ele>100.0</ele><time>2026-10-04T17:30:00Z</time>
    <extensions><power>180</power><gpxtpx:TrackPointExtension><gpxtpx:atemp>27</gpxtpx:atemp><gpxtpx:hr>131</gpxtpx:hr><gpxtpx:cad>82</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions>
   </trkpt>
   <trkpt lon='-156.3299000' lat='20.8001000'><ele>100.6</ele><time>2026-10-04T17:30:02Z</time>
    <extensions><power>200</power><gpxtpx:TrackPointExtension><gpxtpx:hr>133</gpxtpx:hr><gpxtpx:cad>84</gpxtpx:cad></gpxtpx:TrackPointExtension></extensions>
   </trkpt>
   <trkpt lat="20.8002000" lon="-156.3298000"><time>2026-10-04T17:30:04Z</time></trkpt>
   <trkpt lat="20.8003000" lon="-156.3297000"><ele>101.2</ele></trkpt>
  </trkseg>
 </trk>
</gpx>`;

const TCX = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:ns3="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
 <Activities><Activity Sport="Biking"><Id>2026-10-04T17:30:00.000Z</Id>
  <Lap StartTime="2026-10-04T17:30:00.000Z"><Track>
   <Trackpoint><Time>2026-10-04T17:30:00.000Z</Time><Position><LatitudeDegrees>20.8</LatitudeDegrees><LongitudeDegrees>-156.33</LongitudeDegrees></Position>
    <AltitudeMeters>100.0</AltitudeMeters><DistanceMeters>0.0</DistanceMeters><HeartRateBpm><Value>128</Value></HeartRateBpm><Cadence>80</Cadence>
    <Extensions><ns3:TPX><ns3:Speed>6.5</ns3:Speed><ns3:Watts>190</ns3:Watts></ns3:TPX></Extensions></Trackpoint>
   <Trackpoint><Time>2026-10-04T17:30:01.000Z</Time><AltitudeMeters>100.3</AltitudeMeters><DistanceMeters>6.5</DistanceMeters>
    <HeartRateBpm><Value>129</Value></HeartRateBpm><Cadence>81</Cadence>
    <Extensions><ns3:TPX><ns3:Speed>6.6</ns3:Speed><ns3:Watts>210</ns3:Watts></ns3:TPX></Extensions></Trackpoint>
  </Track></Lap>
 </Activity></Activities>
</TrainingCenterDatabase>`;

describe("GPX parser", () => {
  const ride = parseGpx(GPX);
  it("reads name, type and timed points, skipping points without a time", () => {
    expect(ride.name).toBe("Makawao & back");
    expect(ride.sport).toBe("cycling");
    expect(ride.samples).toHaveLength(3);
  });
  it("reads position whatever the attribute order or quoting", () => {
    expect(ride.samples[0]).toMatchObject({ lat: 20.8, lon: -156.33, ele: 100 });
    expect(ride.samples[1]).toMatchObject({ lat: 20.8001, lon: -156.3299 });
  });
  it("reads heart rate, cadence and power extensions", () => {
    expect(ride.samples[0]).toMatchObject({ hr: 131, cad: 82, power: 180 });
    expect(ride.samples[1]).toMatchObject({ hr: 133, cad: 84, power: 200 });
    expect(ride.samples[2].hr).toBeUndefined();
    expect(ride.samples[1].t - ride.samples[0].t).toBe(2);
  });
  it("is found by sniffing and rejects other XML", () => {
    expect(parseRideFile(new TextEncoder().encode(GPX).buffer as ArrayBuffer).format).toBe("gpx");
    expect(() => parseGpx("<kml></kml>")).toThrow(/Not a GPX/);
  });
});

describe("TCX parser", () => {
  const ride = parseTcx(TCX);
  it("reads sport and every trackpoint field", () => {
    expect(ride.sport).toBe("Biking");
    expect(ride.samples).toHaveLength(2);
    expect(ride.samples[0]).toMatchObject({ lat: 20.8, lon: -156.33, ele: 100, dist: 0, hr: 128, cad: 80, power: 190, speed: 6.5 });
    expect(ride.samples[1]).toMatchObject({ dist: 6.5, hr: 129, power: 210 });
    expect(ride.samples[1].lat).toBeUndefined();
  });
  it("is found by sniffing", () => {
    expect(parseRideFile(new TextEncoder().encode(TCX).buffer as ArrayBuffer).format).toBe("tcx");
  });
});

// ─────────────────────────────────────────────────────────────────────
// Summary maths
// ─────────────────────────────────────────────────────────────────────
describe("ride summary maths", () => {
  it("haversine: one degree of latitude is about 111.2 km", () => {
    expect(haversine(20, -156, 21, -156) / 1000).toBeCloseTo(111.2, 0);
    expect(haversine(20.8, -156.33, 20.8, -156.33)).toBe(0);
  });

  it("normalized power equals the average for a perfectly steady effort", () => {
    expect(normalizedPower(new Array(600).fill(200))).toBeCloseTo(200, 6);
  });

  it("normalized power is above the average for a surging effort", () => {
    const watts: number[] = [];
    for (let i = 0; i < 1200; i++) watts.push(Math.floor(i / 120) % 2 === 0 ? 100 : 300);
    const np = normalizedPower(watts);
    expect(np).toBeGreaterThan(215); // the average is 200
    expect(np).toBeLessThan(300);
    expect(normalizedPower([200, 200])).toBe(0); // too short to say
  });

  it("best average finds the strongest window", () => {
    const watts = [...new Array(100).fill(100), ...new Array(60).fill(400), ...new Array(100).fill(100)];
    expect(bestAverage(watts, 60)).toBe(400);
    expect(bestAverage(watts, 120)).toBe(250);
    expect(bestAverage(watts, 1000)).toBeUndefined();
  });

  it("local time stamps follow the offset", () => {
    expect(localStamp(Date.parse("2026-10-04T17:30:00Z") / 1000, -600)).toBe("2026-10-04T07:30:00");
    expect(localStamp(Date.parse("2026-01-01T03:00:00Z") / 1000, -600)).toBe("2025-12-31T17:00:00");
  });

  it("counts stops and long pauses out of moving time, and measures distance and climbing from GPS", () => {
    const samples = [];
    let t = 1_800_000_000;
    let lat = 20.8;
    let ele = 50;
    // 10 minutes riding north at about 5.6 m/s, climbing 0.2 m per second
    for (let i = 0; i < 600; i++) {
      samples.push({ t, lat, lon: -156.33, ele, hr: 140 });
      t += 1;
      lat += 0.00005;
      ele += 0.2;
    }
    // 5 minutes standing still (recording, not moving)
    for (let i = 0; i < 300; i++) {
      samples.push({ t, lat, lon: -156.33, ele, hr: 100 });
      t += 1;
    }
    // a 20 minute auto-pause, then 5 more minutes of riding on the flat
    t += 1200;
    for (let i = 0; i < 300; i++) {
      samples.push({ t, lat, lon: -156.33, ele, hr: 150 });
      t += 1;
      lat += 0.00005;
    }
    const result = summarizeRide({ format: "gpx", samples }, { id: "g", fallbackName: "GPS ride", utcOffsetMin: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const r = result.ride;
    expect(r.movingSec).toBeGreaterThan(890);
    expect(r.movingSec).toBeLessThan(905);
    expect(r.elapsedSec).toBe(2399);
    // 900 steps of 0.00005 degrees of latitude = 0.045 degrees = about 5.0 km
    expect(r.distanceM / 1000).toBeCloseTo(5.0, 1);
    // 600 s x 0.2 m = 120 m of climbing (minus the 3 m threshold at the end)
    expect(r.climbM).toBeGreaterThan(114);
    expect(r.climbM).toBeLessThanOrEqual(120);
    expect(r.maxHr).toBe(150);
    expect(r.indoor).toBe(false);
    expect(r.avgPower).toBeUndefined();
  });

  it("refuses non-rides and empty files with a reason", () => {
    const run = summarizeRide(
      { format: "gpx", sport: "running", samples: [{ t: 1 }, { t: 100 }] },
      { id: "r", fallbackName: "Run", utcOffsetMin: 0 }
    );
    expect(run.ok).toBe(false);
    if (!run.ok) expect(run.reason).toMatch(/not a ride/);
    const empty = summarizeRide({ format: "gpx", samples: [] }, { id: "e", fallbackName: "x", utcOffsetMin: 0 });
    expect(empty.ok).toBe(false);
  });

  it("treats an indoor ride with no GPS as moving while pedalling", () => {
    const samples = [];
    for (let i = 0; i < 900; i++) samples.push({ t: 1_800_000_000 + i, cad: 90, power: 180, hr: 135 });
    const result = summarizeRide({ format: "fit", sport: "cycling", subSport: "indoor_cycling", samples }, { id: "i", fallbackName: "Rollers", utcOffsetMin: 0 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.ride.movingSec).toBe(899);
    expect(result.ride.indoor).toBe(true);
    expect(result.ride.kind).toBe("virtual");
    expect(result.ride.avgPower).toBe(180);
    expect(result.ride.normPower).toBe(180);
    expect(result.ride.avgCadence).toBe(90);
  });
});
