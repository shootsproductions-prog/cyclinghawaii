// Fit sessions live in the visitor's browser (IndexedDB) and nowhere
// else. Nothing in this file talks to the network.
//
// Export produces a single JSON file (images included as base64) so a
// rider can move sessions between devices or keep a backup. Import
// validates everything it reads, because the file may have been edited
// or come from someone else.

import { LANDMARK_ORDER } from "./landmarks";
import { DEFAULT_CRANK_LENGTH_MM } from "./ranges";
import type {
  FitSession,
  FrameData,
  FrameKind,
  LandmarkId,
  Landmarks,
  SessionSettings,
} from "./types";

const DB_NAME = "cyclinghawaii-fit";
const DB_VERSION = 1;
const STORE = "sessions";

export const EXPORT_APP = "cyclinghawaii-fit";
export const EXPORT_VERSION = 1;

/** Refuse absurd imports rather than fill the device. */
const MAX_IMPORT_SESSIONS = 200;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export function storageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!storageAvailable()) {
      reject(new Error("This browser does not offer local storage for fit sessions."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
    request.onblocked = () => reject(new Error("Local storage is busy in another tab."));
  });
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        let result: T;
        request.onsuccess = () => {
          result = request.result;
        };
        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("Local storage failed."));
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("Local storage ran out of room or was interrupted."));
        };
      })
  );
}

/** Newest first. */
export async function listSessions(): Promise<FitSession[]> {
  const all = await run<FitSession[]>("readonly", (store) => store.getAll());
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveSession(session: FitSession): Promise<void> {
  await run("readwrite", (store) => store.put(session));
}

export async function deleteSession(id: string): Promise<void> {
  await run("readwrite", (store) => store.delete(id));
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ───────────────────── Export / import ─────────────────────

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

interface ExportedFrame extends Omit<FrameData, "image"> {
  imageBase64?: string;
}

interface ExportedSession extends Omit<FitSession, "frames"> {
  frames: Partial<Record<FrameKind, ExportedFrame>>;
}

export interface ExportFile {
  app: typeof EXPORT_APP;
  version: number;
  exportedAt: string;
  sessions: ExportedSession[];
}

export function buildExport(
  sessions: FitSession[],
  options: { includeImages: boolean; now?: Date } = { includeImages: true }
): ExportFile {
  return {
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: (options.now ?? new Date()).toISOString(),
    sessions: sessions.map((s) => {
      const frames: Partial<Record<FrameKind, ExportedFrame>> = {};
      for (const kind of Object.keys(s.frames) as FrameKind[]) {
        const frame = s.frames[kind];
        if (!frame) continue;
        const { image, ...rest } = frame;
        frames[kind] = {
          ...rest,
          ...(options.includeImages && image ? { imageBase64: bufferToBase64(image) } : {}),
        };
      }
      return { ...s, frames };
    }),
  };
}

const FRAME_KINDS: FrameKind[] = ["bottom", "forward", "top"];
const STYLES = ["endurance", "performance", "gravel"] as const;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function text(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function parseLandmarks(value: unknown): Landmarks {
  const out: Landmarks = {};
  if (!isRecord(value)) return out;
  for (const id of LANDMARK_ORDER) {
    const p = value[id];
    if (isRecord(p) && finite(p.x) && finite(p.y)) out[id] = { x: p.x, y: p.y };
  }
  return out;
}

function parseFrame(kind: FrameKind, value: unknown): FrameData | null {
  if (!isRecord(value)) return null;
  if (!finite(value.width) || !finite(value.height) || value.width <= 0 || value.height <= 0) {
    return null;
  }
  const frame: FrameData = {
    kind,
    width: value.width,
    height: value.height,
    landmarks: parseLandmarks(value.landmarks),
    source: value.source === "video" || value.source === "sample" ? value.source : "photo",
  };
  if (Array.isArray(value.autoPlaced)) {
    frame.autoPlaced = value.autoPlaced.filter((id): id is LandmarkId =>
      (LANDMARK_ORDER as string[]).includes(id as string)
    );
  }
  if (typeof value.imageBase64 === "string" && value.imageBase64.length > 0) {
    // Base64 is 4/3 the size of the bytes it encodes.
    if (value.imageBase64.length * 0.75 <= MAX_IMAGE_BYTES) {
      try {
        frame.image = base64ToBuffer(value.imageBase64);
        frame.imageType = IMAGE_TYPES.includes(value.imageType as string)
          ? (value.imageType as string)
          : "image/jpeg";
      } catch {
        // Not valid base64: keep the landmarks, drop the picture.
      }
    }
  }
  return frame;
}

function parseSettings(value: unknown): SessionSettings {
  const v = isRecord(value) ? value : {};
  const crank = finite(v.crankLengthMm) && v.crankLengthMm >= 100 && v.crankLengthMm <= 220
    ? v.crankLengthMm
    : DEFAULT_CRANK_LENGTH_MM;
  const tilt = finite(v.tiltDeg) ? Math.max(-15, Math.min(15, v.tiltDeg)) : 0;
  return {
    style: (STYLES as readonly string[]).includes(v.style as string)
      ? (v.style as SessionSettings["style"])
      : "endurance",
    captureMode: v.captureMode === "static" ? "static" : "pedalling",
    crankLengthMm: crank,
    crankLengthConfirmed: v.crankLengthConfirmed === true,
    tiltDeg: tilt,
  };
}

/**
 * Read an export file. Throws with a rider-readable message if the
 * file is not one of ours; silently drops anything malformed inside
 * an otherwise valid file.
 */
export function parseExport(json: string): FitSession[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("That file is not valid JSON, so it is not a fit export.");
  }
  if (!isRecord(data) || data.app !== EXPORT_APP || !Array.isArray(data.sessions)) {
    throw new Error("That file is not a Cycling Hawaii fit export.");
  }
  if (finite(data.version) && data.version > EXPORT_VERSION) {
    throw new Error("That export was made by a newer version of this tool.");
  }
  const sessions: FitSession[] = [];
  for (const raw of data.sessions.slice(0, MAX_IMPORT_SESSIONS)) {
    if (!isRecord(raw)) continue;
    const id = text(raw.id, 80);
    const createdAt = text(raw.createdAt, 40);
    if (!id || Number.isNaN(Date.parse(createdAt))) continue;
    const frames: Partial<Record<FrameKind, FrameData>> = {};
    if (isRecord(raw.frames)) {
      for (const kind of FRAME_KINDS) {
        const frame = parseFrame(kind, raw.frames[kind]);
        if (frame) frames[kind] = frame;
      }
    }
    if (Object.keys(frames).length === 0) continue;
    const changeNote = text(raw.changeNote, 500);
    sessions.push({
      id,
      createdAt: new Date(createdAt).toISOString(),
      label: text(raw.label, 120, "Imported session"),
      ...(changeNote ? { changeNote } : {}),
      settings: parseSettings(raw.settings),
      frames,
    });
  }
  return sessions;
}
