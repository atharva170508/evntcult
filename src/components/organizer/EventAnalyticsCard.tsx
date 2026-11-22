"use client";

import { useEffect, useRef, useState } from "react";
import type { EventAnalytics } from "@/lib/data/analytics";

const HUE = "#5B3FB0"; // single series: one violet, validated against the white card
const GRID = "#EEE9DD";
const nf = new Intl.NumberFormat("en-IN");

const dayLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
const timeLabel = (at: string) => {
  const [h, m] = at.slice(11).split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
const niceMax = (v: number) => {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
};

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Analytics for one event: how sign-ups grew, when people arrived, and which ticket types sold.
 * Each chart has a hover readout and a table view, so nothing depends on colour or hover alone.
 */
export function EventAnalyticsCard({ data }: { data: EventAnalytics }) {
  const [tab, setTab] = useState<"signups" | "arrivals">("signups");
  const hasArrivals = data.arrivals.length > 0;
  if (data.daily.length < 2 && !hasArrivals && !data.viewsTotal) return null;
  const delta = data.last7 - data.prev7;

  return (
    <section aria-labelledby="an-h" className="card mt-5 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 md:px-5">
        <div>
          <h2 id="an-h" className="text-h4 font-semibold">
            {tab === "signups" ? "Sign-ups over time" : "Arrivals at the door"}
          </h2>
          <p className="mt-0.5 text-[13px] tabular-nums text-ink-muted">
            {tab === "signups"
              ? `${nf.format(data.last7)} in the last 7 days${data.prev7 || data.last7 ? `, ${delta === 0 ? "same as" : `${delta > 0 ? "+" : "−"}${nf.format(Math.abs(delta))} vs`} the week before` : ""}`
              : `${nf.format(data.arrivals.reduce((s, a) => s + a.n, 0))} scanned in, per 15 minutes`}
          </p>
        </div>
        {hasArrivals && data.daily.length >= 2 && (
          <div role="tablist" aria-label="Chart" className="ui-seg">
            <span className="ui-seg-pill" style={{ transform: `translateX(${tab === "signups" ? 4 : 98}px)`, width: 92, left: 0 }} aria-hidden />
            {(["signups", "arrivals"] as const).map((t) => (
              <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="ui-seg-item w-[92px] justify-center" style={{ color: tab === t ? "#fff" : undefined }}>
                {t === "signups" ? "Sign-ups" : "Arrivals"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 pb-4 pt-5 md:px-5">
        {tab === "signups" || !hasArrivals ? <SignupsChart daily={data.daily} /> : <ArrivalsChart arrivals={data.arrivals} />}
        {data.tiers.length > 1 && <TierBars tiers={data.tiers} />}
        {data.viewsTotal > 0 && <ViewsBlock data={data} />}
        <details className="mt-4 text-[13.5px]">
          <summary className="cursor-pointer font-semibold text-ink-2 hover:text-ink">Show as a table</summary>
          <table className="mt-3 w-full text-left tabular-nums">
            <thead className="text-[12.5px] text-ink-muted">
              <tr>
                <th className="py-1.5 font-medium">{tab === "signups" || !hasArrivals ? "Day" : "Time"}</th>
                <th className="py-1.5 text-right font-medium">{tab === "signups" || !hasArrivals ? "New" : "Arrived"}</th>
                {(tab === "signups" || !hasArrivals) && <th className="py-1.5 text-right font-medium">Total</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(tab === "signups" || !hasArrivals ? data.daily.filter((d) => d.added > 0) : data.arrivals).map((r) =>
                "day" in r ? (
                  <tr key={r.day}>
                    <td className="py-1.5">{dayLabel(r.day)}</td>
                    <td className="py-1.5 text-right">{nf.format(r.added)}</td>
                    <td className="py-1.5 text-right">{nf.format(r.total)}</td>
                  </tr>
                ) : (
                  <tr key={r.at}>
                    <td className="py-1.5">{timeLabel(r.at)}</td>
                    <td className="py-1.5 text-right">{nf.format(r.n)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}

const H = 180;
const PAD = { l: 36, r: 44, t: 12, b: 24 };

function SignupsChart({ daily }: { daily: EventAnalytics["daily"] }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...daily.map((d) => d.total)));
  const iw = Math.max(1, W - PAD.l - PAD.r);
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (daily.length === 1 ? iw / 2 : (i / (daily.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const line = daily.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.total).toFixed(1)}`).join("");
  const area = `${line}L${x(daily.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const last = daily[daily.length - 1];
  const ticks = max % 2 ? [0, max] : [0, max / 2, max];
  const xl = [0, Math.floor((daily.length - 1) / 2), daily.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const h = hover !== null ? daily[hover] : null;

  return (
    <div ref={ref} className="relative">
      {W > 0 && (
        <svg
          width={W}
          height={H}
          role="img"
          aria-label={`Sign-ups grew to ${last.total} by ${dayLabel(last.day)}`}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const i = Math.round(((e.clientX - r.left - PAD.l) / iw) * (daily.length - 1));
            setHover(Math.max(0, Math.min(daily.length - 1, i)));
          }}
          onPointerLeave={() => setHover(null)}
          className="block touch-none"
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-subtle text-[11px] tabular-nums">
                {nf.format(t)}
              </text>
            </g>
          ))}
          {xl.map((i) => (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === daily.length - 1 ? "end" : "middle"} className="fill-ink-subtle text-[11px]">
              {dayLabel(daily[i].day)}
            </text>
          ))}
          <path d={area} fill={HUE} fillOpacity={0.1} />
          <path d={line} fill="none" stroke={HUE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(daily.length - 1)} cy={y(last.total)} r={4} fill={HUE} stroke="#fff" strokeWidth={2} />
          <text x={x(daily.length - 1) + 8} y={y(last.total) + 4} className="fill-ink text-[12px] font-semibold tabular-nums">
            {nf.format(last.total)}
          </text>
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={y(0)} stroke="#1A1A1A" strokeOpacity={0.25} strokeWidth={1} />
              <circle cx={x(hover)} cy={y(h.total)} r={5} fill={HUE} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-[10px] bg-ink px-3 py-2 text-[12.5px] tabular-nums text-white shadow-lg"
          style={{ left: x(hover) + 156 > W ? x(hover) - 152 : x(hover) + 12, width: 140 }}
        >
          <p className="font-semibold">{dayLabel(h.day)}</p>
          <p className="text-white/75">
            {h.added ? `+${nf.format(h.added)} new` : "No new sign-ups"}, {nf.format(h.total)} total
          </p>
        </div>
      )}
    </div>
  );
}

function ArrivalsChart({ arrivals }: { arrivals: EventAnalytics["arrivals"] }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...arrivals.map((a) => a.n)));
  const iw = Math.max(1, W - PAD.l - 12);
  const ih = H - PAD.t - PAD.b;
  const band = iw / arrivals.length;
  const bw = Math.max(3, Math.min(24, band - 2));
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const peak = arrivals.reduce((p, a, i) => (a.n > arrivals[p].n ? i : p), 0);
  const step = Math.max(1, Math.ceil(arrivals.length / 6));

  return (
    <div ref={ref} className="relative">
      {W > 0 && (
        <svg width={W} height={H} role="img" aria-label={`Busiest at ${timeLabel(arrivals[peak].at)} with ${arrivals[peak].n} arrivals`} className="block" onPointerLeave={() => setHover(null)}>
          {(max % 2 ? [0, max] : [0, max / 2, max]).map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={W - 12} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
              <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="fill-ink-subtle text-[11px] tabular-nums">
                {nf.format(t)}
              </text>
            </g>
          ))}
          {arrivals.map((a, i) => {
            const cx = PAD.l + band * i + band / 2;
            const top = y(a.n);
            const hgt = y(0) - top;
            const r = Math.min(4, bw / 2, hgt);
            return (
              <g key={a.at} onPointerEnter={() => setHover(i)}>
                <rect x={PAD.l + band * i} y={PAD.t} width={band} height={ih} fill="transparent" />
                <path
                  d={`M${cx - bw / 2},${y(0)}V${top + r}Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top}H${cx + bw / 2 - r}Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r}V${y(0)}Z`}
                  fill={HUE}
                  fillOpacity={hover === null || hover === i ? 1 : 0.45}
                />
                {i % step === 0 && (
                  <text x={cx} y={H - 6} textAnchor="middle" className="fill-ink-subtle text-[11px]">
                    {timeLabel(a.at)}
                  </text>
                )}
              </g>
            );
          })}
          <text x={PAD.l + band * peak + band / 2} y={y(arrivals[peak].n) - 6} textAnchor="middle" className="fill-ink text-[12px] font-semibold tabular-nums">
            {arrivals[peak].n}
          </text>
        </svg>
      )}
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-[10px] bg-ink px-3 py-2 text-[12.5px] tabular-nums text-white shadow-lg"
          style={{ left: PAD.l + band * hover + band / 2 + 136 > W ? PAD.l + band * hover + band / 2 - 132 : PAD.l + band * hover + band / 2 + 12, width: 120 }}
        >
          <p className="font-semibold">{timeLabel(arrivals[hover].at)}</p>
          <p className="text-white/75">{arrivals[hover].n} arrived</p>
        </div>
      )}
    </div>
  );
}

function TierBars({ tiers }: { tiers: EventAnalytics["tiers"] }) {
  const max = Math.max(...tiers.map((t) => t.n));
  const total = tiers.reduce((s, t) => s + t.n, 0);
  return (
    <div className="mt-5 border-t border-line pt-4">
      <h3 className="text-[14px] font-semibold text-ink">Ticket types</h3>
      <ul className="mt-3 space-y-2.5">
        {tiers.map((t) => (
          <li key={t.name} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 text-[13.5px]">
            <span className="truncate text-ink-2">{t.name}</span>
            <span className="flex items-center gap-2">
              <span className="h-3 rounded-r-[4px]" style={{ width: `${Math.max(2, (t.n / max) * 80)}%`, background: HUE }} />
              <span className="shrink-0 font-semibold tabular-nums text-ink">
                {nf.format(t.n)} <span className="font-normal text-ink-muted">({Math.round((t.n / total) * 100)}%)</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const SOURCE_NAME: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  google: "Google",
  linkedin: "LinkedIn",
  x: "X",
  evntcult: "EvntCult",
  qr: "QR poster",
  direct: "Direct link",
  other: "Other sites",
};

/** Page views for the last 14 days and where visitors came from (Luma Insights, Posh tracking links). */
function ViewsBlock({ data }: { data: EventAnalytics }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(1, ...data.views.map((v) => v.n)));
  const recent = data.views.reduce((s, v) => s + v.n, 0);
  // Only compare like with like: sign-ups and views from the same 14 days, once there are enough views to mean something.
  const rawRate = recent >= 30 ? Math.round(((data.last7 + data.prev7) / recent) * 100) : null;
  const rate = rawRate !== null && rawRate <= 100 ? rawRate : null;
  const smax = Math.max(...data.sources.map((x) => x.n));
  const h = hover !== null ? data.views[hover] : null;
  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-ink">Page views</h3>
        <p className="text-[13px] tabular-nums text-ink-muted" aria-live="polite">
          {h ? `${dayLabel(h.day)}: ${nf.format(h.n)} ${h.n === 1 ? "view" : "views"}` : `${nf.format(recent)} in 14 days${rate !== null ? `, ${rate}% of visitors signed up` : ""}`}
        </p>
      </div>
      <div className="relative mt-3 h-24" role="img" aria-label={`Page views per day for the last 14 days, ${nf.format(recent)} in total`}>
        <div aria-hidden className="absolute inset-x-0 top-0 border-t border-dashed" style={{ borderColor: GRID }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 border-t" style={{ borderColor: GRID }} />
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.views.map((v, i) => (
            <div key={v.day} className="flex h-full flex-1 items-end" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <div
                className="w-full rounded-t-[4px] transition-opacity"
                style={{ height: `${v.n ? Math.max(4, (v.n / max) * 100) : 0}%`, background: HUE, opacity: hover === null || hover === i ? 1 : 0.45 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[11.5px] tabular-nums text-ink-subtle">
        <span>{dayLabel(data.views[0].day)}</span>
        <span>Today</span>
      </div>
      <h3 className="mt-5 text-[14px] font-semibold text-ink">Where visitors came from</h3>
      <ul className="mt-3 space-y-2.5">
        {data.sources.map((x) => (
          <li key={x.source} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 text-[13.5px]">
            <span className="truncate text-ink-2">{SOURCE_NAME[x.source] ?? x.source}</span>
            <span className="flex items-center gap-2">
              <span className="h-3 rounded-r-[4px]" style={{ width: `${Math.max(2, (x.n / smax) * 80)}%`, background: HUE }} />
              <span className="shrink-0 font-semibold tabular-nums text-ink">
                {nf.format(x.n)} <span className="font-normal text-ink-muted">({Math.round((x.n / data.viewsTotal) * 100)}%)</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12.5px] text-ink-muted">Tip: add ?ref=whatsapp or ?ref=instagram to the link you share, so each post shows up here by name.</p>
    </div>
  );
}
