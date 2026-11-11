/**
 * Browser-side storage for the gate scanner (IndexedDB), shared with public/sw.js.
 *
 *   queue        scans waiting to be sent (key: client_scan_id)
 *   guest-lists  the offline guest list per event (key: eventId)
 *
 * Keep the database name, version and store names in sync with public/sw.js.
 */
"use client";

import type { Manifest } from "@/lib/data/checkins";

export const DB_NAME = "evntcult-scanner";
const DB_VERSION = 1;

export interface QueuedScan {
  client_scan_id: string;
  event_id: string;
  /** From the QR; a manual check-in sends registration_id instead. */
  pass_token?: string;
  registration_id?: string;
  accept_unpaid: boolean;
  scanned_at: string;
  device_id: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "client_scan_id" });
      if (!db.objectStoreNames.contains("guest-lists")) db.createObjectStore("guest-lists", { keyPath: "eventId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

export const queueScan = (s: QueuedScan) => tx("queue", "readwrite", (st) => st.put(s)).then(() => undefined);
export const removeQueued = (id: string) => tx("queue", "readwrite", (st) => st.delete(id)).then(() => undefined);
export const queuedScans = async (eventId: string) =>
  ((await tx("queue", "readonly", (st) => st.getAll())) as QueuedScan[]).filter((s) => s.event_id === eventId);

export const saveGuestList = (m: Manifest) => tx("guest-lists", "readwrite", (st) => st.put(m)).then(() => undefined);
export const loadGuestList = async (eventId: string) => ((await tx("guest-lists", "readonly", (st) => st.get(eventId))) as Manifest | undefined) ?? null;

/** A stable id for this phone/laptop, so the audit log can tell gates apart. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem("evntcult-device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("evntcult-device", id);
    }
    return id;
  } catch {
    return "unknown-device";
  }
}

/** SHA-256 hex, same as tokenHash() on the server. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
