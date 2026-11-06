/*
 * EvntCult gate-scanner service worker.
 *
 *  1. Keeps the scanner working offline: the scanner page is saved when it loads
 *     (network first, saved copy when offline) and app files are cached.
 *  2. Sends queued offline scans in the background when the connection comes back
 *     (Background Sync, where the browser supports it; the page also syncs itself,
 *     so iPhones work too). Sending a scan twice is safe: the server de-duplicates
 *     on client_scan_id.
 *
 * Keep the IndexedDB names in sync with src/lib/scanner/offline-store.ts.
 */
const CACHE = "evntcult-scanner-v1";
const DB_NAME = "evntcult-scanner";
const SYNC_TAG = "evntcult-scans";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("evntcult-scanner-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // App code and fonts: never change for a given URL, so cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // The scanner page itself: network first, saved copy when offline.
  if (req.mode === "navigate" && url.pathname.startsWith("/organizer/scan/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || new Response("Offline and this scanner wasn't opened before.", { status: 503 }))),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(flushQueue());
});

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("queue")) db.createObjectStore("queue", { keyPath: "client_scan_id" });
      if (!db.objectStoreNames.contains("guest-lists")) db.createObjectStore("guest-lists", { keyPath: "eventId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function storeOp(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction("queue", mode);
    const r = fn(t.objectStore("queue"));
    t.oncomplete = () => resolve(r.result);
    t.onerror = () => reject(t.error);
  });
}

async function flushQueue() {
  const db = await openDb();
  const scans = await storeOp(db, "readonly", (s) => s.getAll());
  let sent = 0;
  const notes = [];
  for (const scan of scans) {
    let res;
    try {
      res = await fetch("/api/checkins", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scan),
      });
    } catch {
      throw new Error("still offline"); // the browser retries the sync later
    }
    // Any verdict (green/amber/red) means the server has decided; 4xx other than auth won't improve on retry.
    if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 401 && res.status !== 403)) {
      if (res.ok) {
        const v = await res.json().catch(() => ({}));
        if (v.result === "already_in") notes.push(`${v.name || "Someone"} was already checked in on another gate`);
        if (v.result === "invalid") notes.push(`A saved scan wasn't valid: ${v.message || ""}`);
      }
      await storeOp(db, "readwrite", (s) => s.delete(scan.client_scan_id));
      sent++;
    }
  }
  db.close();
  if (!sent) return;
  const clients = await self.clients.matchAll();
  for (const c of clients) c.postMessage({ type: "scans-synced", sent, notes });
}
