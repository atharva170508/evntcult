/**
 * EvntCult's stationery-grade email system, in table markup every client renders (Gmail, Apple Mail,
 * Outlook). Warm cream paper, EB Garamond editorial headings, a perforated boarding-pass ticket
 * stub with tear notches, tactile lavender CTA with ink outline, and zero external images so
 * nothing breaks when images are blocked.
 */
export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SANS = "'Figtree','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'EB Garamond',Georgia,'Times New Roman',serif";
const MONO = "'JetBrains Mono','SFMono-Regular',Menlo,Consolas,monospace";
const INK = "#1A1A1A";
const INK2 = "#3F3F3F";
const MUTED = "#6A6A6A";
const SUBTLE = "#8A857A";
const PAPER = "#FFFEF6";
const SUNKEN = "#F6F3EA";
const DESK = "#ECE7D9";
const LINE = "#DDD6C5";
const LAVENDER = "#F0D7FF";
const CRIMSON = "#E3264F";

export const P = (html: string, extra = "") =>
  `<p style="margin:0 0 16px;font-family:${SANS};font-size:15.5px;line-height:1.65;color:${INK2};${extra}">${html}</p>`;

/** Signature EvntCult lavender CTA button with 2px ink outline. */
export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 6px">
<tr><td bgcolor="${LAVENDER}" style="background:${LAVENDER};border:2px solid ${INK};border-radius:14px">
<a href="${esc(href)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:15px;font-weight:700;letter-spacing:-0.1px;color:${INK};text-decoration:none">${esc(label)}</a>
</td></tr></table>`;
}

/** Quiet editorial secondary action links separated by slashes. */
export function links(items: { href: string; label: string }[]) {
  return `<p style="margin:16px 0 0;font-family:${SANS};font-size:13.5px;line-height:1.7">${items
    .map(
      (i) =>
        `<a href="${esc(i.href)}" style="color:${INK};font-weight:600;text-decoration:underline;text-decoration-color:#C7C0AC;text-underline-offset:4px">${esc(i.label)}</a>`,
    )
    .join(`<span style="color:#B8B2A0">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`)}</p>`;
}

/**
 * Physical boarding-pass ticket stub: accent header ribbon, EB Garamond title, crisp key/value
 * rows, a perforated tear line, and a sunken warm-paper bottom stub for the pass code.
 */
export function stub(o: { title: string; rows: [string, string][]; code?: string; accent?: string }) {
  const accent = o.accent ?? CRIMSON;
  const rows = o.rows
    .map(
      ([k, v]) =>
        `<tr>
          <td style="padding:7px 12px 7px 0;font-family:${SANS};font-size:12.5px;font-weight:500;color:${MUTED};width:82px;vertical-align:top;border-bottom:1px solid #F1EDE2">${esc(k)}</td>
          <td style="padding:7px 0;font-family:${SANS};font-size:14.5px;font-weight:600;color:${INK};border-bottom:1px solid #F1EDE2">${esc(v)}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 24px;border:1px solid ${LINE};border-radius:18px;background:#FFFFFF;border-collapse:separate;overflow:hidden">
<tr><td style="background:${accent};padding:9px 22px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="font-family:${MONO};font-size:10.5px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#FFFFFF">Admit one</td>
    <td align="right" style="font-family:${MONO};font-size:10.5px;font-weight:500;letter-spacing:0.06em;color:rgba(255,255,255,0.85)">EvntCult Pass</td>
  </tr></table>
</td></tr>
<tr><td style="padding:22px 24px 16px">
  <div style="font-family:${SERIF};font-size:30px;line-height:1.08;letter-spacing:-0.4px;color:${INK}">${esc(o.title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;border-collapse:collapse">${rows}</table>
</td></tr>
${
  o.code
    ? `<tr><td style="padding:0 18px;background:#FFFFFF">
        <div style="border-top:2px dashed ${LINE};font-size:0;line-height:0">&nbsp;</div>
      </td></tr>
      <tr><td bgcolor="${SUNKEN}" style="background:${SUNKEN};padding:16px 24px 18px;border-radius:0 0 17px 17px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td>
            <div style="font-family:${SANS};font-size:11.5px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${MUTED}">Your pass</div>
            <div style="margin-top:3px;font-family:${SERIF};font-size:28px;line-height:1.1;color:${INK}">${esc(o.code)}</div>
          </td>
          <td align="right" valign="bottom" style="font-family:${SANS};font-size:12px;color:${MUTED}">
            Works offline<br>at the gate
          </td>
        </tr></table>
      </td></tr>`
    : ""
}
</table>`;
}

/** Warm editorial host note in sunken paper framing. */
export function note(from: string, text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:${SUNKEN};border:1px solid ${LINE};border-radius:14px">
<tr><td style="padding:18px 20px">
  <div style="font-family:${SANS};font-size:12px;font-weight:600;color:${MUTED};margin-bottom:6px">Note from ${esc(from)}</div>
  <div style="font-family:${SERIF};font-size:19px;line-height:1.45;color:${INK};white-space:pre-line">&ldquo;${esc(text)}&rdquo;</div>
</td></tr></table>`;
}

const STAR_LABELS = ["", "Rough", "Okay", "Good", "Great", "Loved it"];

/** Five tappable rating tiles with sentiment labels; opens the event feedback card pre-filled. */
export function stars(base: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 14px">
<tr>${[1, 2, 3, 4, 5]
    .map(
      (n) => `<td align="center" style="padding:0 4px 0 0;width:20%">
        <a href="${esc(`${base}${base.includes("?") ? "&" : "?"}rate=${n}#feedback`)}" aria-label="${n} of 5, ${STAR_LABELS[n]}"
          style="display:block;padding:12px 4px 10px;text-align:center;border:1px solid ${LINE};border-radius:14px;background:#FFFFFF;text-decoration:none">
          <div style="font-size:24px;line-height:1;color:${CRIMSON}">&#9733;</div>
          <div style="margin-top:6px;font-family:${SANS};font-size:11px;font-weight:600;color:${INK}">${STAR_LABELS[n]}</div>
        </a>
      </td>`,
    )
    .join("")}</tr></table>`;
}

/** Master cream-paper email envelope. */
export function layout(o: { title: string; preheader: string; heading: string; body: string; footer: string; siteUrl: string }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Figtree:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${DESK};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${DESK}" style="background:${DESK}">
<tr><td align="center" style="padding:36px 14px 44px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:540px">
    <tr><td style="padding:0 6px 18px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td><a href="${esc(o.siteUrl)}" style="font-family:${SANS};font-size:23px;font-weight:800;letter-spacing:-0.8px;color:${CRIMSON};text-decoration:none">evntcult</a></td>
        <td align="right" valign="middle" style="font-family:${SANS};font-size:12px;font-weight:600;color:${SUBTLE}">Every event, one pass</td>
      </tr></table>
    </td></tr>
    <tr><td bgcolor="${PAPER}" style="background:${PAPER};border:1px solid ${LINE};border-radius:22px;padding:38px 34px 34px">
      <h1 style="margin:0 0 18px;font-family:${SERIF};font-weight:400;font-size:38px;line-height:1.04;letter-spacing:-0.6px;color:${INK}">${esc(o.heading)}</h1>
      ${o.body}
    </td></tr>
    <tr><td style="padding:20px 8px 0;font-family:${SANS};font-size:12px;line-height:1.65;color:${SUBTLE}">
      ${o.footer}<br>
      <span style="color:#9E988B">EvntCult &middot; Made by Synchronous Labs</span>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
