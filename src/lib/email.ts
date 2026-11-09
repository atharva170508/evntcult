/**
 * Sends the login-code email.
 *
 * Provider: Brevo (https://www.brevo.com), called with plain fetch, so no extra package.
 * Secrets (set with `npx wrangler secret put`, never committed):
 *   BREVO_API_KEY   the Brevo API key
 *   EMAIL_FROM      the verified sender address, e.g. evntcult.app@gmail.com
 * For local testing only, put EMAIL_PROVIDER=log in .dev.vars: codes are printed to the
 * server log instead of being emailed.
 *
 * If neither is set, code login is OFF and the old email-only login keeps working
 * (the sign-in page shows that the code check is "Planned").
 */
type EmailEnv = { BREVO_API_KEY?: string; EMAIL_FROM?: string; EMAIL_PROVIDER?: string };

export type EmailMode = "brevo" | "log" | "off";

export function emailMode(env: EmailEnv = process.env as EmailEnv): EmailMode {
  if (env.BREVO_API_KEY && env.EMAIL_FROM) return "brevo";
  if (env.EMAIL_PROVIDER === "log") return "log";
  return "off";
}

export const codeLoginOn = (env?: EmailEnv) => emailMode(env) !== "off";

export class EmailError extends Error {}

/** Tables and inline styles only: email apps ignore most modern CSS. */
export function loginCodeHtml(code: string): string {
  const mono = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
  const sans = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>Your EvntCult code</title></head>
<body style="margin:0;padding:0;background:#08080c">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${code} is your EvntCult code</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#08080c" style="background:#08080c"><tr><td align="center" style="padding:48px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px">
<tr><td style="font-family:${sans};font-size:26px;font-weight:800;letter-spacing:-1px;color:#f2f3f7;padding:0 0 32px">ev<span style="color:#dcfe62">|</span>ntcult</td></tr>
<tr><td bgcolor="#dcfe62" align="center" style="background:#dcfe62;border-radius:16px;padding:36px 12px">
<div style="font-family:${sans};font-size:13px;font-weight:600;color:#08080c;padding:0 0 12px">Your login code</div>
<div style="font-family:${mono};font-size:44px;line-height:1;font-weight:700;letter-spacing:10px;margin-right:-10px;color:#08080c">${code}</div>
</td></tr>
<tr><td align="center" style="font-family:${sans};font-size:14px;color:#a6a9b5;padding:24px 0 0">It expires in 10 minutes.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function sendLoginCode(email: string, code: string, env: EmailEnv = process.env as EmailEnv): Promise<void> {
  const mode = emailMode(env);
  if (mode === "log") {
    console.log(`[email:log] login code for ${email}: ${code}`);
    return;
  }
  if (mode !== "brevo") throw new EmailError("Email sending isn't set up.");

  const text = `Your EvntCult login code is ${code}\n\nIt expires in 10 minutes.`;
  const html = loginCodeHtml(code);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "EvntCult", email: env.EMAIL_FROM },
      to: [{ email }],
      subject: `${code} is your EvntCult login code`,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    console.error(`[email] Brevo send failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
    throw new EmailError("We couldn't send the email. Try again in a minute.");
  }
}
