"use client";

/**
 * Gate scanner. Camera → jsQR → /api/checkins → green / amber / red.
 *
 * Works without a network:
 *  • On open it saves the event's guest list (hashed pass tokens) to the phone.
 *  • If a scan can't reach the server, the verdict comes from that list and the scan
 *    is queued; queued scans are sent when the connection returns (by this page,
 *    and by the service worker's Background Sync where the browser supports it).
 *  • Every scan has its own client_scan_id, so sending it twice is harmless.
 *
 * jsQR (not the BarcodeDetector API) because iPhone Safari has no BarcodeDetector.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import jsQR from "jsqr";
import type { Manifest, ManifestEntry } from "@/lib/data/checkins";
import { extractPassToken } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { cn, fmtTime } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { Odometer } from "@/components/organizer-ui/primitives";
import { deviceId, loadGuestList, queueScan, queuedScans, removeQueued, saveGuestList, sha256Hex, type QueuedScan } from "@/lib/scanner/offline-store";

interface EventInfo {
  id: string;
  slug: string;
  title: string;
  venue: string;
  status: string;
  pricePaise: number;
  startsAt: string;
  endsAt: string;
}

interface Counts {
  checkedIn: number;
  registered: number;
}

interface MerchLine {
  id: string;
  label: string;
  left: number | null;
  claimedAt: string | null;
  note?: string;
}

type Verdict =
  | { color: "green"; title: string; name?: string; code?: string; note?: string; merch?: MerchLine[]; token?: string; regId?: string; offlineScan?: QueuedScan; hash?: string }
  | { color: "amber"; title: string; name?: string; code?: string; note?: string; collect?: { amountPaise: number; scan: QueuedScan }; merch?: MerchLine[]; token?: string }
  | { color: "red"; title: string; note?: string };

interface ServerVerdict {
  result: "admitted" | "already_in" | "unpaid" | "invalid";
  registrationId?: string;
  name?: string;
  passCode?: string;
  scannedAt?: string;
  amountPaise?: number;
  claimedUtr?: string | null;
  message?: string;
  counts?: Counts;
  merch?: MerchLine[];
}

const CLAIM_QUEUE = "evntcult-merch-queue";
type QueuedClaim = { token: string; item_id: string; client_claim_id: string; claimed_at: string };
const readClaims = (): QueuedClaim[] => {
  try {
    return JSON.parse(localStorage.getItem(CLAIM_QUEUE) ?? "[]") as QueuedClaim[];
  } catch {
    return [];
  }
};
const writeClaims = (q: QueuedClaim[]) => {
  try {
    localStorage.setItem(CLAIM_QUEUE, JSON.stringify(q));
  } catch {
    // storage full or blocked: the claim stays on screen only
  }
};

const SAME_CODE_PAUSE_MS = 3000;
/** Express mode: a green verdict clears itself so the next person can be scanned straight away. */
const EXPRESS_DISMISS_MS = 900;
/** §9: undo is offered for 5 seconds after each admit. */
const UNDO_MS = 5000;
const EXPRESS_KEY = "evntcult-gate-express";

function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
    osc.onended = () => ctx.close();
    navigator.vibrate?.(ok ? 60 : [80, 60, 80]);
  } catch {
    // sound is a nice-to-have
  }
}

function toVerdict(v: ServerVerdict, scan: QueuedScan, pricePaise: number): Verdict {
  switch (v.result) {
    case "admitted":
      return { color: "green", title: "Admitted", name: v.name, code: v.passCode, merch: v.merch, token: scan.pass_token, regId: v.registrationId };
    case "already_in":
      // §9: duplicate → amber "Already checked in at 10:42", and the count doesn't move.
      return { color: "amber", title: v.scannedAt ? `Already checked in at ${fmtTime(new Date(v.scannedAt))}` : "Already checked in", name: v.name, code: v.passCode, merch: v.merch, token: scan.pass_token };
    case "unpaid":
      return { color: "amber", title: `Collect ${formatINR(v.amountPaise ?? pricePaise)}`, name: v.name, code: v.passCode, note: v.claimedUtr ? `Says paid by UPI, ID ${v.claimedUtr}. Not confirmed yet.` : "Not paid yet. Take the fee, then admit.", collect: { amountPaise: v.amountPaise ?? pricePaise, scan } };
    default:
      return { color: "red", title: "Not valid", note: v.message };
  }
}

export function GateScanner({ event, initialCounts }: { event: EventInfo; initialCounts: Counts }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const busyRef = useRef(false);
  const lastCodeRef = useRef<{ text: string; at: number } | null>(null);
  const guestRef = useRef<Map<string, ManifestEntry>>(new Map());
  const seenRef = useRef<Set<string>>(new Set()); // hashes admitted offline on this phone
  const merchRef = useRef<{ id: string; label: string; left: number | null }[]>([]);

  const [camera, setCamera] = useState<"off" | "starting" | "on" | "error">("off");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [online, setOnline] = useState(true);
  const [liveMode, setLiveMode] = useState<"live" | "polling">("polling");
  const [queued, setQueued] = useState(0);
  const [guestList, setGuestList] = useState<{ size: number; savedAt: string } | null>(null);
  const [recent, setRecent] = useState<{ id: string; color: Verdict["color"]; text: string; at: Date; offline: boolean }[]>([]);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [authProblem, setAuthProblem] = useState<string | null>(null);
  const [express, setExpress] = useState(true);
  const [undoable, setUndoable] = useState<{ key: string; name: string; regId?: string; scan?: QueuedScan; hash?: string } | null>(null);
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<ManifestEntry[]>([]);

  // Express is on unless this phone turned it off (§9: "Express on by default").
  useEffect(() => {
    try {
      if (localStorage.getItem(EXPRESS_KEY) === "off") setExpress(false);
    } catch {
      // storage blocked: stay on
    }
  }, []);
  const toggleExpress = () =>
    setExpress((on) => {
      try {
        localStorage.setItem(EXPRESS_KEY, on ? "off" : "on");
      } catch {
        // fine
      }
      return !on;
    });

  // The undo offer disappears after 5 seconds.
  useEffect(() => {
    if (!undoable) return;
    const t = setTimeout(() => setUndoable((u) => (u?.key === undoable.key ? null : u)), UNDO_MS);
    return () => clearTimeout(t);
  }, [undoable]);

  const addRecent = (color: Verdict["color"], text: string, offline: boolean) =>
    setRecent((r) => [{ id: crypto.randomUUID(), color, text, at: new Date(), offline }, ...r].slice(0, 12));

  /* ── Guest list (offline checking) ─────────────────────────────────── */

  const applyGuestList = useCallback((m: Manifest) => {
    guestRef.current = new Map(m.entries.map((e) => [e.h, e]));
    setEntries(m.entries);
    merchRef.current = m.merch ?? [];
    setGuestList({ size: m.entries.length, savedAt: m.generatedAt });
  }, []);

  const refreshGuestList = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${event.id}/guest-list`, { cache: "no-store" });
      if (res.status === 401 || res.status === 403) return setAuthProblem("You're signed out, or this isn't your event. Sign in again to keep scanning.");
      if (!res.ok) throw new Error();
      const m = (await res.json()) as Manifest;
      await saveGuestList(m);
      applyGuestList(m);
    } catch {
      const saved = await loadGuestList(event.id).catch(() => null);
      if (saved) applyGuestList(saved);
    }
  }, [event.id, applyGuestList]);

  /** Keep the saved list in step with the gate, so a search right after an admit shows them as inside. */
  const markInside = useCallback((regId: string, at: string | null) => {
    setEntries((list) => list.map((e) => (e.r === regId ? { ...e, in: at } : e)));
    for (const e of guestRef.current.values()) if (e.r === regId) e.in = at;
  }, []);

  /* ── Offline queue sync ────────────────────────────────────────────── */

  const refreshQueued = useCallback(async () => setQueued((await queuedScans(event.id).catch(() => [])).length), [event.id]);

  const syncing = useRef(false);
  const syncQueue = useCallback(async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const scans = await queuedScans(event.id);
      let sent = 0;
      const surprises: string[] = [];
      for (const scan of scans) {
        let res: Response;
        try {
          res = await fetch("/api/checkins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scan) });
        } catch {
          break; // still offline
        }
        if (res.status === 401 || res.status === 403) {
          setAuthProblem("You're signed out. Sign in again so the saved scans can be sent.");
          break;
        }
        if (res.ok) {
          const v = (await res.json()) as ServerVerdict;
          if (v.counts) setCounts(v.counts);
          if (v.result === "already_in") surprises.push(`${v.name ?? "Someone"} was already checked in on another gate`);
          if (v.result === "invalid") surprises.push(`A saved scan wasn't valid: ${v.message ?? ""}`);
        }
        if (res.ok || res.status < 500) {
          await removeQueued(scan.client_scan_id);
          sent++;
        }
      }
      if (sent) setSyncNote(`Sent ${sent} saved scan${sent > 1 ? "s" : ""}.${surprises.length ? ` ${surprises.join(". ")}.` : ""}`);
    } finally {
      syncing.current = false;
      await refreshQueued();
    }
  }, [event.id, refreshQueued]);

  /* ── Startup: service worker, guest list, online status ────────────── */

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);
    // The service worker sent queued scans in the background (Background Sync).
    const onMsg = (e: MessageEvent<{ type?: string; sent?: number; notes?: string[] }>) => {
      if (e.data?.type !== "scans-synced") return;
      const n = e.data.sent ?? 0;
      setSyncNote(`Sent ${n} saved scan${n === 1 ? "" : "s"}.${e.data.notes?.length ? ` ${e.data.notes.join(". ")}.` : ""}`);
      refreshQueued();
      fetch(`/api/events/${event.id}/gate-count`, { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<Counts>) : null))
        .then((c) => c && setCounts(c))
        .catch(() => undefined);
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);

    setOnline(navigator.onLine);
    const up = () => {
      setOnline(true);
      syncQueue();
      refreshGuestList();
    };
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);

    refreshGuestList();
    refreshQueued().then(() => syncQueue());
    const timer = setInterval(() => {
      syncQueue();
      refreshGuestList(); // pick up people who registered after the scanner opened
    }, 60_000);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onMsg);
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      clearInterval(timer);
    };
  }, [event.id, refreshGuestList, refreshQueued, syncQueue]);

  /* ── Live count: WebSocket to the event's Durable Object, polling as a fallback ── */

  useEffect(() => {
    let ws: WebSocket | null = null;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;

    const connect = () => {
      try {
        ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/api/events/${event.id}/live`);
      } catch {
        return;
      }
      ws.onopen = () => {
        setLiveMode("live");
        ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), 25_000);
      };
      ws.onmessage = (m) => {
        try {
          const d = JSON.parse(m.data as string);
          if (d.type === "counts") setCounts({ checkedIn: d.checkedIn, registered: d.registered });
        } catch {
          // "pong"
        }
      };
      ws.onclose = () => {
        setLiveMode("polling");
        clearInterval(ping);
        if (!closed) retry = setTimeout(connect, 10_000);
      };
    };
    connect();

    const poll = setInterval(async () => {
      if (ws?.readyState === WebSocket.OPEN) return;
      try {
        const res = await fetch(`/api/events/${event.id}/gate-count`, { cache: "no-store" });
        if (res.ok) setCounts(await res.json());
      } catch {
        // offline
      }
    }, 5000);

    return () => {
      closed = true;
      clearTimeout(retry);
      clearInterval(ping);
      clearInterval(poll);
      ws?.close();
    };
  }, [event.id]);

  /* ── Decide a scan ─────────────────────────────────────────────────── */

  const show = useCallback(
    (v: Verdict) => {
      setVerdict(v);
      beep(v.color === "green");
      if (v.color === "green") {
        setUndoable({ key: crypto.randomUUID(), name: v.name ?? "Guest", regId: v.regId, scan: v.offlineScan, hash: v.hash });
        if (express && !v.merch?.length) setTimeout(() => setVerdict((cur) => (cur === v ? null : cur)), EXPRESS_DISMISS_MS);
      }
    },
    [express],
  );

  /** Decide without the server, from the saved guest list. */
  const decideOffline = useCallback(
    async (scan: QueuedScan): Promise<Verdict> => {
      const entry = scan.registration_id
        ? [...guestRef.current.values()].find((e) => e.r === scan.registration_id)
        : guestRef.current.get(await sha256Hex(extractPassToken(scan.pass_token ?? "")));
      const h = entry?.h ?? "";
      if (!guestRef.current.size) return { color: "red", title: "Can't check offline", note: "The guest list hasn't been saved on this phone yet. Connect once to download it." };
      if (!entry) return { color: "red", title: "Not on the guest list", note: "Not a pass for this event (checked offline)." };
      const offlineMerch = merchRef.current.map((i) => ({ ...i, claimedAt: entry.m?.[i.id] ?? null }));
      if (entry.in || seenRef.current.has(h)) return { color: "amber", title: "Already checked in", name: entry.name, code: entry.code, merch: offlineMerch, token: scan.pass_token, note: entry.in ? `First scanned at ${fmtTime(new Date(entry.in))}` : "Scanned on this phone earlier." };
      if (entry.unpaid && !scan.accept_unpaid) {
        return { color: "amber", title: `Collect ${formatINR(event.pricePaise)}`, name: entry.name, code: entry.code, note: "Not paid yet. Take the fee, then admit.", collect: { amountPaise: event.pricePaise, scan } };
      }
      await queueScan(scan);
      seenRef.current.add(h);
      markInside(entry.r, scan.scanned_at);
      await refreshQueued();
      navigator.serviceWorker?.ready.then((reg) => (reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }).sync?.register("evntcult-scans")).catch(() => undefined);
      return { color: "green", title: "Admitted", name: entry.name, code: entry.code, merch: offlineMerch, token: scan.pass_token, note: "Saved offline. It syncs when you're back online.", offlineScan: scan, hash: h };
    },
    [event.pricePaise, refreshQueued, markInside],
  );

  const submit = useCallback(
    async (scan: QueuedScan) => {
      let v: Verdict;
      let offline = false;
      try {
        const res = await fetch("/api/checkins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scan) });
        if (res.status === 401 || res.status === 403) {
          setAuthProblem("You're signed out, or this isn't your event. Sign in again to keep scanning.");
          v = { color: "red", title: "Not signed in", note: "Sign in again to scan." };
        } else if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        } else {
          const data = (await res.json()) as ServerVerdict;
          if (data.counts) setCounts(data.counts);
          if (data.registrationId && (data.result === "admitted" || data.result === "already_in")) markInside(data.registrationId, data.scannedAt ?? new Date().toISOString());
          v = toVerdict(data, scan, event.pricePaise);
          if (data.result === "admitted" && scan.pass_token) {
            const h = await sha256Hex(extractPassToken(scan.pass_token));
            seenRef.current.add(h);
          }
        }
      } catch {
        offline = true;
        v = await decideOffline(scan);
      }
      show(v);
      const label = "name" in v && v.name ? `${v.title} · ${v.name}` : v.title;
      addRecent(v.color, label, offline);
    },
    [decideOffline, event.pricePaise, show, markInside],
  );

  const onCode = useCallback(
    async (text: string) => {
      const now = Date.now();
      if (lastCodeRef.current && lastCodeRef.current.text === text && now - lastCodeRef.current.at < SAME_CODE_PAUSE_MS) return;
      lastCodeRef.current = { text, at: now };
      busyRef.current = true;
      await submit({
        client_scan_id: crypto.randomUUID(),
        event_id: event.id,
        pass_token: text,
        accept_unpaid: false,
        scanned_at: new Date().toISOString(),
        device_id: deviceId(),
      });
      busyRef.current = false;
    },
    [event.id, submit],
  );

  /* ── Camera loop ───────────────────────────────────────────────────── */

  const startCamera = useCallback(async () => {
    setCamera("starting");
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true"); // iPhone: don't go full-screen
      video.muted = true;
      await video.play();
      setCamera("on");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setCameraError(
        name === "NotAllowedError"
          ? "Camera access was blocked. On iPhone: Settings → Safari → Camera → Allow. On Android: tap the lock icon in the address bar → Permissions → Camera."
          : name === "NotFoundError"
            ? "No camera found on this device."
            : !window.isSecureContext
              ? "The camera only works on https:// (or localhost)."
              : "Couldn't start the camera. Close other apps using it and try again.",
      );
      setCamera("error");
    }
  }, []);

  useEffect(() => {
    if (camera !== "on") return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 150 || busyRef.current || verdict) return;
      last = t;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;
      const g = canvas.getContext("2d", { willReadFrequently: true });
      if (!g) return;
      g.drawImage(video, 0, 0, w, h);
      const code = jsQR(g.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
      if (code?.data) onCode(code.data);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, verdict, onCode]);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  /* ── Goodies ───────────────────────────────────────────────────────── */

  const flushClaims = useCallback(async () => {
    const queue = readClaims();
    for (const claim of queue) {
      try {
        const res = await fetch("/api/merch/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(claim) });
        if (res.status === 401 || res.status === 403) return;
        writeClaims(readClaims().filter((c) => c.client_claim_id !== claim.client_claim_id));
      } catch {
        return; // still offline
      }
    }
  }, []);

  useEffect(() => {
    void flushClaims();
    window.addEventListener("online", flushClaims);
    const t = setInterval(flushClaims, 20_000);
    return () => {
      window.removeEventListener("online", flushClaims);
      clearInterval(t);
    };
  }, [flushClaims]);

  const updateLine = (id: string, patch: Partial<MerchLine>) =>
    setVerdict((v) => (v && v.color !== "red" && v.merch ? ({ ...v, merch: v.merch.map((l) => (l.id === id ? { ...l, ...patch } : l)) } as Verdict) : v));

  const give = async (line: MerchLine, token: string) => {
    const claim: QueuedClaim = { token, item_id: line.id, client_claim_id: crypto.randomUUID(), claimed_at: new Date().toISOString() };
    try {
      const res = await fetch("/api/merch/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(claim) });
      if (res.status === 401 || res.status === 403) return updateLine(line.id, { note: "Sign in again to give this." });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = (await res.json()) as { result: string; claimedAt?: string; left?: number | null; message?: string; claimed?: number };
      if (r.result === "claimed") updateLine(line.id, { claimedAt: r.claimedAt ?? claim.claimed_at, left: r.left ?? null, note: undefined });
      else if (r.result === "already_claimed") updateLine(line.id, { claimedAt: r.claimedAt ?? null, note: `Already collected at ${fmtTime(new Date(r.claimedAt ?? claim.claimed_at))}` });
      else if (r.result === "sold_out") updateLine(line.id, { left: 0, note: `${r.message} · ${r.claimed ?? 0} given` });
      else updateLine(line.id, { note: r.message });
    } catch {
      writeClaims([...readClaims(), claim]);
      const h = await sha256Hex(extractPassToken(token));
      const entry = guestRef.current.get(h);
      if (entry) entry.m = { ...entry.m, [line.id]: claim.claimed_at };
      updateLine(line.id, { claimedAt: claim.claimed_at, note: "Saved offline" });
    }
  };

  /* ── Unpaid: the volunteer collected the fee ───────────────────────── */

  const admitUnpaid = async () => {
    if (verdict?.color !== "amber" || !verdict.collect) return;
    const scan = { ...verdict.collect.scan, accept_unpaid: true, client_scan_id: crypto.randomUUID() };
    setVerdict(null);
    busyRef.current = true;
    await submit(scan);
    busyRef.current = false;
  };

  /* ── Undo the last admit (5 s) ────────────────────────────────────── */

  const undo = async () => {
    const u = undoable;
    if (!u) return;
    setUndoable(null);
    setVerdict(null);
    if (u.scan) {
      // Admitted offline: it never left this phone, so take it out of the queue.
      await removeQueued(u.scan.client_scan_id);
      if (u.hash) seenRef.current.delete(u.hash);
      if (u.scan.registration_id) markInside(u.scan.registration_id, null);
      else for (const e of guestRef.current.values()) if (e.h === u.hash) markInside(e.r, null);
      await refreshQueued();
      addRecent("amber", `Undone · ${u.name}`, true);
      return;
    }
    if (!u.regId) return;
    try {
      const res = await fetch(`/api/registrations/${u.regId}/undo-checkin`, { method: "POST" });
      if (!res.ok) throw new Error();
      const c = await fetch(`/api/events/${event.id}/gate-count`, { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<Counts>) : null));
      if (c) setCounts(c);
      markInside(u.regId, null);
      addRecent("amber", `Undone · ${u.name}`, false);
      void refreshGuestList();
    } catch {
      addRecent("red", `Couldn't undo ${u.name}. Use the guest list.`, false);
    }
  };

  /* ── Manual check-in from the saved guest list (§9) ─────────────────── */

  const q = query.trim().toLowerCase();
  const matches = q.length < 2 ? [] : entries.filter((e) => e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)).slice(0, 6);
  const manualCheckIn = async (e: ManifestEntry) => {
    setQuery("");
    busyRef.current = true;
    await submit({ client_scan_id: crypto.randomUUID(), event_id: event.id, registration_id: e.r, accept_unpaid: false, scanned_at: new Date().toISOString(), device_id: deviceId() });
    busyRef.current = false;
  };

  /* ── UI ────────────────────────────────────────────────────────────── */

  const pct = counts.registered ? Math.min(100, Math.round((counts.checkedIn / counts.registered) * 100)) : 0;
  // Colour is never the only signal: every verdict also says it in words, and has its own mark.
  const tone = { green: "bg-ok text-accent-ink", amber: "bg-warn text-accent-ink", red: "bg-bad text-ink" } as const;
  const mark = { green: "✓", amber: "!", red: "×" } as const;

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3 border-b border-line pb-3">
        <Link href={`/events/${event.slug}`} className={buttonClass("ghost", "sm", "-ml-2 px-2")}>
          <span aria-hidden>←</span> Event
        </Link>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Gate</p>
          <h1 className="truncate text-title">{event.title}</h1>
        </div>
        <p role="status" className={cn("shrink-0 font-mono text-caption", online ? "text-ok" : "text-warn")}>
          {online ? "● Online" : "○ Offline"}
          {queued > 0 && ` · ${queued} to sync`}
        </p>
      </header>

      {authProblem && (
        <p role="alert" className="border-l-2 border-bad pl-3 text-body">
          {authProblem}{" "}
          <Link href={`/signin?next=/organizer/scan/${event.id}`} className="font-semibold underline underline-offset-4">
            Sign in
          </Link>
        </p>
      )}

      {/* §9: the count is the largest thing on the screen. Mono, rolls like an odometer. */}
      <section aria-label="Gate count">
        <p className="flex items-baseline gap-3 font-mono tabular-nums">
          <span className="text-display font-medium leading-none" aria-live="polite">
            <Odometer value={String(counts.checkedIn)} />
          </span>
          <span className="text-body text-ink-muted">/ {counts.registered} in</span>
        </p>
        <div className="mt-3 h-1 overflow-hidden rounded-sm bg-surface-3" role="meter" aria-valuenow={counts.checkedIn} aria-valuemin={0} aria-valuemax={counts.registered} aria-label="Checked in">
          <div className="h-full bg-ok" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-mono text-caption text-ink-subtle">{liveMode === "live" ? "Live" : "Updates every 5 s"}</p>
          <button type="button" role="switch" aria-checked={express} onClick={toggleExpress} className="press flex h-8 items-center gap-2 rounded-sm px-1 text-label">
            <span className={cn("relative h-4 w-7 rounded-full border", express ? "border-ok bg-ok" : "border-line-strong bg-surface-3")} aria-hidden>
              <span className={cn("absolute top-0.5 size-2.5 rounded-full bg-canvas transition-transform duration-micro", express ? "translate-x-3.5" : "translate-x-0.5")} />
            </span>
            Express {express ? "on" : "off"}
          </button>
        </div>
      </section>

      <section className="relative aspect-square overflow-hidden rounded-md border border-line bg-canvas">
        <video ref={videoRef} className={cn("size-full object-cover", camera !== "on" && "hidden")} playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {camera === "on" && !verdict && <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-md border-2 border-ink/80" />}

        {camera !== "on" && !verdict && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-xs text-body text-ink-muted">{cameraError ?? "Point the camera at a pass QR code."}</p>
            <button onClick={startCamera} disabled={camera === "starting"} className={buttonClass("primary", "lg")}>
              {camera === "starting" ? "Starting…" : camera === "error" ? "Try again" : "Start camera"}
            </button>
          </div>
        )}

        {verdict && (
          <div className={cn("absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto p-6 text-center", tone[verdict.color])} role="alert" aria-live="assertive">
            <p className="font-mono text-heading leading-none" aria-hidden>
              {mark[verdict.color]}
            </p>
            <p className="font-display text-heading uppercase">{verdict.title}</p>
            {"name" in verdict && verdict.name && <p className="text-title">{verdict.name}</p>}
            {"code" in verdict && verdict.code && <p className="font-mono text-body-sm">{verdict.code}</p>}
            {verdict.note && <p className="max-w-xs text-body">{verdict.note}</p>}

            {verdict.color !== "red" && verdict.token && !!verdict.merch?.length && (
              <ul className="w-full max-w-xs text-left text-body" aria-label="Goodies">
                {verdict.merch.map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-3 border-t border-accent-ink/20 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{line.label}</span>
                      <span className="block font-mono text-caption">{line.note ?? (line.claimedAt ? `claimed ${fmtTime(new Date(line.claimedAt))}` : line.left === 0 ? "none left" : "not claimed")}</span>
                    </span>
                    {!line.claimedAt && line.left !== 0 && (
                      <button onClick={() => give(line, verdict.token!)} className="press h-8 shrink-0 rounded-sm bg-accent-ink px-3 text-label font-semibold text-ink">
                        Give
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {verdict.color === "amber" && verdict.collect ? (
              <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
                <button onClick={admitUnpaid} className="press h-12 rounded-md bg-accent-ink text-body font-semibold text-ink">
                  Collected {formatINR(verdict.collect.amountPaise)} · Admit
                </button>
                <button onClick={() => setVerdict(null)} className="press h-10 rounded-md border border-accent-ink/40 text-body font-semibold">
                  Don&apos;t admit
                </button>
              </div>
            ) : (
              (verdict.color !== "green" || !express || !!verdict.merch?.length) && (
                <button onClick={() => setVerdict(null)} className="press mt-2 h-10 rounded-md border border-current px-6 text-body font-semibold">
                  Scan next
                </button>
              )
            )}
          </div>
        )}
      </section>

      {undoable && (
        <div role="status" className="flex items-center justify-between gap-3 border-l-2 border-ok bg-surface px-3 py-2">
          <span className="min-w-0 truncate text-body-sm">
            Admitted <span className="font-semibold">{undoable.name}</span>
          </span>
          <button onClick={undo} className={buttonClass("secondary", "sm")}>
            Undo
          </button>
        </div>
      )}

      {/* §9: manual search against the saved list — works offline too. */}
      <section aria-labelledby="find-h">
        <label id="find-h" htmlFor="gate-find" className="text-label text-ink-muted">
          No QR? Find by name or pass code
        </label>
        <input
          id="gate-find"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Diya or EC-NEON-0001"
          autoComplete="off"
          className="mt-2 h-12 w-full rounded-sm border border-line-strong bg-surface px-3 text-body placeholder:text-ink-subtle"
        />
        {q.length >= 2 && (
          <ul className="mt-2 border-t border-line">
            {matches.length === 0 && <li className="py-3 text-body-sm text-ink-muted">No one on the saved list matches.</li>}
            {matches.map((e) => (
              <li key={e.r} className="flex items-center justify-between gap-3 border-b border-line py-2">
                <span className="min-w-0">
                  <span className="block truncate text-body font-semibold">{e.name}</span>
                  <span className="block font-mono text-caption text-ink-muted">
                    {e.code}
                    {e.in ? ` · in at ${fmtTime(new Date(e.in))}` : e.unpaid ? " · to pay" : ""}
                  </span>
                </span>
                <button onClick={() => manualCheckIn(e)} disabled={!!e.in} className={buttonClass("secondary", "sm")}>
                  {e.in ? "Inside" : "Check in"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-1 font-mono text-caption text-ink-muted">
        {guestList ? (
          <p className="flex items-center justify-between gap-2">
            <span>
              Saved for offline · {guestList.size} passes · {fmtTime(new Date(guestList.savedAt))}
            </span>
            <button onClick={refreshGuestList} className="press h-8 rounded-sm px-2 text-label text-ink-muted hover:text-ink">
              Refresh list
            </button>
          </p>
        ) : (
          <p>Saving the guest list for offline use…</p>
        )}
        {syncNote && <p className="text-ok">{syncNote}</p>}
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent-h">
          <h2 id="recent-h" className="eyebrow mb-2">
            Recent scans
          </h2>
          <ul className="border-t border-line">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 border-b border-line py-2 text-body-sm">
                <span className={cn("w-3 shrink-0 font-mono", r.color === "green" ? "text-ok" : r.color === "amber" ? "text-warn" : "text-bad")} aria-hidden>
                  {mark[r.color]}
                </span>
                <span className="sr-only">{r.color === "green" ? "Admitted:" : r.color === "amber" ? "Warning:" : "Refused:"}</span>
                <span className="min-w-0 flex-1 truncate">{r.text}</span>
                {r.offline && <span className="font-mono text-caption text-warn">offline</span>}
                <time className="shrink-0 font-mono text-caption text-ink-subtle">{fmtTime(r.at)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
