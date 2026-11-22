/**
 * EvntCult's email look, in table markup every client renders: cream paper, the red wordmark,
 * EB Garamond headings (Georgia where web fonts don't load), a ticket stub with a perforation,
 * and one lavender button with an ink outline. No images, so nothing breaks when they're blocked.
 */
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const SANS = "'Figtree','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'EB Garamond',Georgia,'Times New Roman',serif";
const MONO = "'SFMono-Regular',Menlo,Consolas,monospace";
const INK = "#1A1A1A";
const MUTED = "#6A6A6A";
const PAPER = "#FFFEF6";
const DESK = "#F1EDE1";
const LINE = "#E4DFD0";

export const P = (html: string, extra = "") => `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.6;color:#3F3F3F;${extra}">${html}</p>`;

export function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px"><tr><td bgcolor="#F0D7FF" style="background:#F0D7FF;border:2px solid ${INK};border-radius:12px">
<a href="${esc(href)}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:15px;font-weight:700;color:${INK};text-decoration:none">${esc(label)}</a></td></tr></table>`;
}

export function links(items: { href: string; label: string }[]) {
  return `<p style="margin:14px 0 0;font-family:${SANS};font-size:14px;line-height:1.6">${items
    .map((i) => `<a href="${esc(i.href)}" style="color:${INK};font-weight:600;text-decoration:underline;text-decoration-color:#C9C2AE;text-underline-offset:3px">${esc(i.label)}</a>`)
    .join(`<span style="color:#B8B2A0">&nbsp;&nbsp;/&nbsp;&nbsp;</span>`)}</p>`;
}

/** The ticket stub: event title, rows of facts, then a perforated tear line and the pass code. */
export function stub(o: { title: string; rows: [string, string][]; code?: string; accent?: string }) {
  const rows = o.rows
    .map(
      ([k, v]) => `<tr><td style="padding:6px 0;font-family:${SANS};font-size:13px;color:${MUTED};width:72px;vertical-align:top">${esc(k)}</td>
<td style="padding:6px 0;font-family:${SANS};font-size:14.5px;font-weight:600;color:${INK}">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 22px;border:1px solid ${LINE};border-radius:16px;background:#FFFFFF;border-collapse:separate">
<tr><td style="height:6px;background:${o.accent ?? "#E3264F"};border-radius:15px 15px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:20px 22px 10px">
<div style="font-family:${SERIF};font-size:26px;line-height:1.15;color:${INK}">${esc(o.title)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px">${rows}</table>
</td></tr>
${
  o.code
    ? `<tr><td style="padding:0 22px"><div style="border-top:2px dashed ${LINE};font-size:0;line-height:0">&nbsp;</div></td></tr>
<tr><td style="padding:14px 22px 18px"><span style="font-family:${SANS};font-size:12.5px;color:${MUTED}">Pass</span><br>
<span style="font-family:${MONO};font-size:22px;letter-spacing:3px;color:${INK}">${esc(o.code)}</span></td></tr>`
    : ""
}
</table>`;
}

export function note(from: string, text: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tr>
<td style="width:3px;background:#F0D7FF;border-radius:2px"></td>
<td style="padding:2px 0 2px 14px"><div style="font-family:${SANS};font-size:12.5px;color:${MUTED};margin-bottom:4px">A note from ${esc(from)}</div>
<div style="font-family:${SERIF};font-size:18px;line-height:1.45;color:${INK};white-space:pre-line">${esc(text)}</div></td></tr></table>`;
}

/** Five tappable stars; each opens the event page with that rating picked. */
export function stars(base: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 8px"><tr>${[1, 2, 3, 4, 5]
    .map(
      (n) => `<td style="padding-right:8px"><a href="${esc(`${base}${base.includes("?") ? "&" : "?"}rate=${n}#feedback`)}" aria-label="${n} star${n > 1 ? "s" : ""}"
style="display:inline-block;width:48px;height:48px;line-height:48px;text-align:center;border:1px solid ${LINE};border-radius:12px;background:#FFFFFF;font-size:24px;color:#E3264F;text-decoration:none">&#9733;</a>
<div style="text-align:center;font-family:${SANS};font-size:11.5px;color:${MUTED};margin-top:4px">${n}</div></td>`,
    )
    .join("")}</tr></table>`;
}

export function layout(o: { title: string; preheader: string; heading: string; body: string; footer: string; siteUrl: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light">
<title>${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${DESK};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${DESK}" style="background:${DESK}"><tr><td align="center" style="padding:36px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
<tr><td style="padding:0 6px 16px"><a href="${esc(o.siteUrl)}" style="font-family:${SANS};font-size:22px;font-weight:800;letter-spacing:-0.6px;color:#E3264F;text-decoration:none">evntcult</a></td></tr>
<tr><td bgcolor="${PAPER}" style="background:${PAPER};border:1px solid ${LINE};border-radius:20px;padding:34px 30px 30px">
<h1 style="margin:0 0 16px;font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.08;letter-spacing:-0.5px;color:${INK}">${esc(o.heading)}</h1>
${o.body}
</td></tr>
<tr><td style="padding:18px 8px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#8A857A">${o.footer}<br>EvntCult. Every event, one pass.</td></tr>
</table></td></tr></table>
</body></html>`;
}
