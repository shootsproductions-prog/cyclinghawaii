// A small decoder for Garmin FIT activity files, written against the
// published FIT protocol. It reads only what the coach needs: the
// per-second `record` messages and the `session` summary.
//
// Handles: 12 and 14 byte headers, little and big endian definitions,
// compressed-timestamp record headers, developer fields (skipped),
// invalid-value sentinels, and chained files. Unknown messages and
// fields are skipped by size, so files from any head unit decode.
//
// Runs in the browser. The file never leaves the device.

import type { ParsedRide, RideSample } from "./types";

/** Seconds between the Unix epoch and the FIT epoch (1989-12-31T00:00:00Z). */
const FIT_EPOCH_OFFSET = 631065600;

const MESG_SESSION = 18;
const MESG_RECORD = 20;
const FIELD_TIMESTAMP = 253;

const MAX_SAMPLES = 400_000;

interface FieldDef {
  num: number;
  size: number;
  baseType: number;
}

interface MessageDef {
  global: number;
  littleEndian: boolean;
  fields: FieldDef[];
  /** Total bytes of developer fields, skipped after the regular ones. */
  devBytes: number;
  size: number;
}

/** [byte size, invalid sentinel] for each numeric base type we read, by type number. */
const BASE: Record<number, { size: number; read: (v: DataView, o: number, le: boolean) => number | null }> = {
  0: { size: 1, read: (v, o) => nz(v.getUint8(o), 0xff) }, // enum
  1: { size: 1, read: (v, o) => nz(v.getInt8(o), 0x7f) }, // sint8
  2: { size: 1, read: (v, o) => nz(v.getUint8(o), 0xff) }, // uint8
  3: { size: 2, read: (v, o, le) => nz(v.getInt16(o, le), 0x7fff) }, // sint16
  4: { size: 2, read: (v, o, le) => nz(v.getUint16(o, le), 0xffff) }, // uint16
  5: { size: 4, read: (v, o, le) => nz(v.getInt32(o, le), 0x7fffffff) }, // sint32
  6: { size: 4, read: (v, o, le) => nz(v.getUint32(o, le), 0xffffffff) }, // uint32
  8: { size: 4, read: (v, o, le) => finite(v.getFloat32(o, le)) }, // float32
  9: { size: 8, read: (v, o, le) => finite(v.getFloat64(o, le)) }, // float64
  10: { size: 1, read: (v, o) => nz(v.getUint8(o), 0) }, // uint8z
  11: { size: 2, read: (v, o, le) => nz(v.getUint16(o, le), 0) }, // uint16z
  12: { size: 4, read: (v, o, le) => nz(v.getUint32(o, le), 0) }, // uint32z
  13: { size: 1, read: (v, o) => nz(v.getUint8(o), 0xff) }, // byte
};

function nz(value: number, invalid: number): number | null {
  return value === invalid ? null : value;
}

function finite(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

function readField(view: DataView, offset: number, field: FieldDef, le: boolean): number | null {
  const base = BASE[field.baseType & 0x1f];
  // Unknown type, or an array: we only want scalars. Arrays read their first element.
  if (!base || field.size < base.size) return null;
  return base.read(view, offset, le);
}

const SEMICIRCLE = 180 / 2 ** 31;

/** FIT sport / sub-sport numbers we care about. */
const SPORT_CYCLING = 2;
const SPORT_E_BIKING = 21;
const SUB_SPORT: Record<number, string> = {
  5: "spin",
  6: "indoor_cycling",
  7: "road",
  8: "mountain",
  9: "downhill",
  11: "cyclocross",
  46: "gravel_cycling",
  58: "virtual_activity",
};

export class FitParseError extends Error {}

export function parseFit(buffer: ArrayBuffer): ParsedRide {
  const view = new DataView(buffer);
  const samples: RideSample[] = [];
  const ride: ParsedRide = { format: "fit", samples };
  let offset = 0;
  let filesRead = 0;

  while (offset + 12 <= view.byteLength) {
    const headerSize = view.getUint8(offset);
    if (headerSize !== 12 && headerSize !== 14) {
      if (filesRead === 0) throw new FitParseError("Not a FIT file (bad header size).");
      break;
    }
    if (offset + headerSize > view.byteLength) break;
    const signature = String.fromCharCode(
      view.getUint8(offset + 8),
      view.getUint8(offset + 9),
      view.getUint8(offset + 10),
      view.getUint8(offset + 11)
    );
    if (signature !== ".FIT") {
      if (filesRead === 0) throw new FitParseError("Not a FIT file (missing .FIT signature).");
      break;
    }
    const dataSize = view.getUint32(offset + 4, true);
    const start = offset + headerSize;
    const end = Math.min(start + dataSize, view.byteLength);
    readRecords(view, start, end, ride);
    filesRead++;
    offset = start + dataSize + 2; // 2 byte CRC after the data
  }

  if (filesRead === 0) throw new FitParseError("Not a FIT file.");
  return ride;
}

function readRecords(view: DataView, start: number, end: number, ride: ParsedRide): void {
  const defs: (MessageDef | undefined)[] = [];
  let offset = start;
  let lastTimestamp = 0;

  while (offset < end) {
    const header = view.getUint8(offset++);
    const compressed = (header & 0x80) !== 0;

    if (!compressed && (header & 0x40) !== 0) {
      // ── Definition message ──
      const local = header & 0x0f;
      const hasDev = (header & 0x20) !== 0;
      if (offset + 5 > end) return;
      const littleEndian = view.getUint8(offset + 1) === 0;
      const global = view.getUint16(offset + 2, littleEndian);
      const count = view.getUint8(offset + 4);
      offset += 5;
      if (offset + count * 3 > end) return;
      const fields: FieldDef[] = [];
      let size = 0;
      for (let i = 0; i < count; i++) {
        const field = {
          num: view.getUint8(offset),
          size: view.getUint8(offset + 1),
          baseType: view.getUint8(offset + 2),
        };
        fields.push(field);
        size += field.size;
        offset += 3;
      }
      let devBytes = 0;
      if (hasDev) {
        if (offset + 1 > end) return;
        const devCount = view.getUint8(offset++);
        if (offset + devCount * 3 > end) return;
        for (let i = 0; i < devCount; i++) {
          devBytes += view.getUint8(offset + 1);
          offset += 3;
        }
      }
      defs[local] = { global, littleEndian, fields, devBytes, size: size + devBytes };
      continue;
    }

    // ── Data message ──
    const local = compressed ? (header >> 5) & 0x03 : header & 0x0f;
    const def = defs[local];
    if (!def) return; // data before its definition: the file is damaged
    if (offset + def.size > end) return;

    let timestamp: number | null = null;
    if (compressed) {
      const timeOffset = header & 0x1f;
      let t = (lastTimestamp & ~0x1f) + timeOffset;
      if (timeOffset < (lastTimestamp & 0x1f)) t += 0x20;
      timestamp = t;
    }

    const wanted = def.global === MESG_RECORD || def.global === MESG_SESSION;
    const values: Record<number, number> = {};
    let fieldOffset = offset;
    for (const field of def.fields) {
      if (field.num === FIELD_TIMESTAMP || wanted) {
        const value = readField(view, fieldOffset, field, def.littleEndian);
        if (value !== null) {
          if (field.num === FIELD_TIMESTAMP) timestamp = value;
          else values[field.num] = value;
        }
      }
      fieldOffset += field.size;
    }
    offset += def.size;
    if (timestamp !== null) lastTimestamp = timestamp;

    if (def.global === MESG_RECORD && timestamp !== null && ride.samples.length < MAX_SAMPLES) {
      const sample: RideSample = { t: timestamp + FIT_EPOCH_OFFSET };
      if (values[0] !== undefined && values[1] !== undefined) {
        sample.lat = values[0] * SEMICIRCLE;
        sample.lon = values[1] * SEMICIRCLE;
      }
      const altitude = values[78] ?? values[2];
      if (altitude !== undefined) sample.ele = altitude / 5 - 500;
      if (values[3] !== undefined) sample.hr = values[3];
      if (values[4] !== undefined) sample.cad = values[4];
      if (values[5] !== undefined) sample.dist = values[5] / 100;
      const speed = values[73] ?? values[6];
      if (speed !== undefined) sample.speed = speed / 1000;
      if (values[7] !== undefined) sample.power = values[7];
      ride.samples.push(sample);
    } else if (def.global === MESG_SESSION) {
      const session = (ride.session ??= {});
      if (values[2] !== undefined) session.startTime = values[2] + FIT_EPOCH_OFFSET;
      if (values[7] !== undefined) session.elapsedSec = values[7] / 1000;
      if (values[8] !== undefined) session.timerSec = values[8] / 1000;
      if (values[9] !== undefined) session.distanceM = values[9] / 100;
      if (values[22] !== undefined) session.ascentM = values[22];
      if (values[16] !== undefined) session.avgHr = values[16];
      if (values[17] !== undefined) session.maxHr = values[17];
      if (values[18] !== undefined) session.avgCadence = values[18];
      if (values[20] !== undefined) session.avgPower = values[20];
      if (values[34] !== undefined) session.normPower = values[34];
      if (values[5] !== undefined) {
        ride.sport =
          values[5] === SPORT_CYCLING
            ? "cycling"
            : values[5] === SPORT_E_BIKING
              ? "e_biking"
              : `sport_${values[5]}`;
      }
      if (values[6] !== undefined && SUB_SPORT[values[6]]) ride.subSport = SUB_SPORT[values[6]];
    }
  }
}
