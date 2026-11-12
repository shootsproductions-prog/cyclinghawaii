// Entry point for ride files: work out the format from the bytes (not
// the file name, which riders rename) and hand off to the right parser.

import { parseFit } from "./fit";
import type { ParsedRide } from "./types";
import { parseGpx, parseTcx } from "./xml";

export type { ParsedRide, RideSample } from "./types";

/** Largest ride file we will try to read, to keep a phone responsive. */
export const MAX_RIDE_FILE_BYTES = 40 * 1024 * 1024;

function looksLikeFit(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[8] === 0x2e && // "."
    bytes[9] === 0x46 && // "F"
    bytes[10] === 0x49 && // "I"
    bytes[11] === 0x54 // "T"
  );
}

export function isGzip(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data, 0, Math.min(2, data.byteLength));
  return bytes.length === 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

/**
 * Parse a FIT, GPX or TCX file. Throws an Error with a message a rider
 * can act on when the file is something else.
 */
export function parseRideFile(data: ArrayBuffer): ParsedRide {
  if (data.byteLength > MAX_RIDE_FILE_BYTES) {
    throw new Error("That file is too large to be a single ride.");
  }
  const bytes = new Uint8Array(data);
  if (looksLikeFit(bytes)) return parseFit(data);
  if (isGzip(data)) {
    throw new Error("That file is compressed (.gz). Unzip it first, then import the file inside.");
  }
  // XML: sniff the first few KB for the root element.
  const text = new TextDecoder("utf-8").decode(bytes);
  const head = text.slice(0, 4096);
  if (/<gpx[\s>]/i.test(head)) return parseGpx(text);
  if (/<TrainingCenterDatabase[\s>]/i.test(head)) return parseTcx(text);
  throw new Error("Not a FIT, GPX or TCX ride file.");
}
