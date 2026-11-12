// Imported rides and the rider's numbers live in the visitor's browser
// and nowhere else. Nothing in this file talks to the network.

import type { CoachRide, RiderProfile } from "./types";

const DB_NAME = "cyclinghawaii-coach";
const DB_VERSION = 1;
const STORE = "rides";
const PROFILE_KEY = "cyclinghawaii-coach-profile";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not offer local storage for rides."));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
  });
}

function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  return openDb().then(
    (db) =>
      new Promise<T | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(request ? request.result : undefined);
        };
        const fail = () => {
          db.close();
          reject(tx.error ?? new Error("Local storage failed."));
        };
        tx.onerror = fail;
        tx.onabort = fail;
      })
  );
}

export async function loadImportedRides(): Promise<CoachRide[]> {
  return (await transact<CoachRide[]>("readonly", (store) => store.getAll())) ?? [];
}

export async function saveImportedRides(rides: CoachRide[]): Promise<void> {
  await transact("readwrite", (store) => {
    for (const ride of rides) store.put(ride);
  });
}

export async function clearImportedRides(): Promise<void> {
  await transact("readwrite", (store) => store.clear());
}

export function loadProfile(): RiderProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined);
    return { maxHr: pick(parsed.maxHr), restHr: pick(parsed.restHr), ftp: pick(parsed.ftp) };
  } catch {
    return {};
  }
}

export function saveProfile(profile: RiderProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Private mode or storage full: the numbers just will not be remembered.
  }
}

/** A stable id for an imported file, so importing the same ride twice replaces it rather than doubling it. */
export function rideIdFor(start: string, movingSec: number, distanceM: number): string {
  return `file-${start}-${movingSec}-${Math.round(distanceM / 10)}`;
}
